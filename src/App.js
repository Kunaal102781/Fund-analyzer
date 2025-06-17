import React, { useState, useEffect, useRef } from "react";
import {
  Chart,
  PieController,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Title,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
// Register Chart.js components
Chart.register(
  PieController,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Title
);
Chart.register(ChartDataLabels);

export default function App() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [financialData, setFinancialData] = useState({
    Income: "",
    Age: "",
    Dependents: "",
    Disposable_Income: "",
    Desired_Savings: "",
    Groceries: "",
    Transport: "",
    Eating_Out: "",
    Entertainment: "",
    Utilities: "",
    Healthcare: "",
    Education: "",
    Miscellaneous: "",
    Occupation: "",
    City_Tier: "",
  });
  const [showFinancialForm, setShowFinancialForm] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState("");

  const pieChartRef = useRef(null);
  const comparisonChartRef = useRef(null);
  const barChartRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const hindiAudioRef = useRef(null);
  const [selectedLang, setSelectedLang] = useState("en");
  const [loadingAudio, setLoadingAudio] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      const savedFinancialData = localStorage.getItem("financialData");
      if (savedFinancialData) {
        setFinancialData(JSON.parse(savedFinancialData));
      }
    }
  }, []);

  useEffect(() => {
    if (
      showAnalysis &&
      Object.values(financialData).some((val) => val !== "")
    ) {
      renderCharts();
      generateAnalysis();
      speakAnalysis();
    }
  }, [showAnalysis, financialData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFinancialChange = (e) => {
    setFinancialData({ ...financialData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    const url = isRegister ? "/api/auth/register" : "/api/auth/login";

    try {
      const res = await fetch("http://localhost:5000" + url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegister
            ? { name: form.name, email: form.email, password: form.password }
            : { email: form.email, password: form.password }
        ),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || data.message || "Failed");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      setForm({ name: "", email: "", password: "" });
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleFinancialSubmit = async () => {
    try {
      localStorage.setItem("financialData", JSON.stringify(financialData));

      const res = await fetch("http://localhost:5001/api/finance/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(financialData),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to save financial data");

      const modelPredictions = data.model_predictions;
      const originalData = financialData;

      // Save them to localStorage (optional for use in renderCharts)
      localStorage.setItem(
        "modelPredictions",
        JSON.stringify(modelPredictions)
      );
      localStorage.setItem("originalInput", JSON.stringify(originalData));
      setShowFinancialForm(false);

      const podcastRes = await fetch(
        "http://localhost:5001/api/finance/podcast",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            user_profile: financialData,
            model_predictions: data.model_predictions, // from /analyze response
            chosen_model: data.chosen_model,
            recommended_output: data.recommended_output,
            cluster: data.cluster,
            financial_health_score: data.financial_health_score,
            visual_hint: data.visual_hint,
          }),
        }
      );
      const podcastData = await podcastRes.json();
      if (!podcastRes.ok)
        throw new Error(podcastData.error || "Failed to fetch podcast data");

      // Optionally store podcast script
      localStorage.setItem("podcastScript", podcastData.podcast_script || "");

      setShowAnalysis(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const renderCharts = () => {
    // Destroy existing charts if they exist
    if (pieChartRef.current) pieChartRef.current.destroy();
    if (barChartRef.current) barChartRef.current.destroy();

    // Prepare expense data for charts
    const expenseCategories = [
      "Groceries",
      "Transport",
      "Eating_Out",
      "Entertainment",
      "Utilities",
      "Healthcare",
      "Education",
      "Miscellaneous",
    ];
    const expenseData = expenseCategories.map(
      (cat) => parseFloat(financialData[cat]) || 0
    );

    const modelPredictions =
      JSON.parse(localStorage.getItem("modelPredictions")) || {};
    const originalInput =
      JSON.parse(localStorage.getItem("originalInput")) || {};

    const originalValues = expenseCategories.map(
      (cat) => parseFloat(originalInput[cat]) || 0
    );
    const predictedValues = expenseCategories.map(
      (cat) => modelPredictions[cat] || 0
    );
    const colors = [
      "#FF6384",
      "#36A2EB",
      "#FFCE56",
      "#4BC0C0",
      "#9966FF",
      "#FF9F40",
      "#8AC24A",
      "#F06292",
    ];

    // Pie Chart - Expense Distribution
    const pieCtx = document.getElementById("expensePieChart").getContext("2d");
    pieChartRef.current = new Chart(pieCtx, {
      type: "pie",
      data: {
        labels: expenseCategories.map((cat) => cat.replace("_", " ")),
        datasets: [
          {
            data: expenseData,
            backgroundColor: colors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#fff",
              boxWidth: 20,
              padding: 15,
              font: {
                family: "'Poppins', sans-serif",
                size: 12,
              },
            },
          },
          datalabels: {
            color: "#fff",
            formatter: (value, context) => {
              const total = context.chart._metasets[0].total;
              const percentage = ((value / total) * 100).toFixed(1);
              return percentage + "%";
            },
            font: {
              weight: "bold",
              size: 12,
            },
          },
        },
      },
    });
    const legendContainer = document.getElementById("customPieLegend");
    if (legendContainer) {
      legendContainer.innerHTML = expenseCategories
        .map((cat, index) => {
          const label = cat.replace("_", " ");
          const value = expenseData[index] ?? 0;
          const color = colors[index];
          return `
      <div style="display: flex; align-items: center; margin-bottom: 6px; color: white; font-family: Poppins, sans-serif; font-size: 0.9rem;">
        <div style="width: 12px; height: 12px; background-color: ${color}; border-radius: 2px; margin-right: 8px;"></div>
        ${label}: $${value}
      </div>
    `;
        })
        .join("");
    }

    // Bar Chart - Income vs Expenses
    const totalExpenses = expenseData.reduce((sum, val) => sum + val, 0);
    const disposableIncome = parseFloat(financialData.Disposable_Income) || 0;
    const barCtx = document.getElementById("incomeBarChart").getContext("2d");
    barChartRef.current = new Chart(barCtx, {
      type: "bar",
      data: {
        labels: ["Income", "Expenses", "Disposable Income"],
        datasets: [
          {
            label: "Amount ($)",
            data: [
              parseFloat(financialData.Income) || 0,
              totalExpenses,
              disposableIncome,
            ],
            backgroundColor: [
              "rgba(75, 192, 192, 0.7)",
              "rgba(255, 99, 132, 0.7)",
              "rgba(54, 162, 235, 0.7)",
            ],
            borderColor: [
              "rgba(75, 192, 192, 1)",
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: "#fff",
            },
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
          },
          x: {
            ticks: {
              color: "#fff",
            },
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
          },
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#fff",
              boxWidth: 20,
              padding: 15,
              font: {
                family: "'Poppins', sans-serif",
                size: 12,
              },
            },
          },

          title: {
            display: true,
            text: "💼 Income vs Expenses",
            color: "#f6d365", // brighter contrasting color
            font: {
              size: 18,
              weight: "bold",
              family: "'Poppins', sans-serif",
            },
            padding: {
              top: 10,
              bottom: 20,
            },
          },
        },
      },
    });

    const comparisonCtx = document
      .getElementById("comparisonChart")
      .getContext("2d");

    if (comparisonChartRef.current) comparisonChartRef.current.destroy();
    const potentialSavings = expenseCategories.map((cat) => {
      const userVal = parseFloat(originalInput[cat]) || 0;
      const predictedVal = parseFloat(modelPredictions[cat]) || 0;
      const diff = Math.max(userVal - predictedVal, 0);
      return Math.round(diff * 100) / 100; // round to 2 decimals as number
    });

    comparisonChartRef.current = new Chart(comparisonCtx, {
      type: "bar",
      data: {
        labels: expenseCategories.map((cat) => cat.replace("_", " ")),
        datasets: [
          {
            label: "Potential Savings",
            data: potentialSavings,
            backgroundColor: "rgba(75, 192, 192, 0.8)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
            borderRadius: 6,
            barThickness: 30,
          },
        ],
      },
      options: {
        responsive: true,
        layout: { padding: { top: 20, bottom: 20 } },
        plugins: {
          legend: {
            position: "top",
            labels: {
              color: "#fff",
              font: {
                family: "'Poppins', sans-serif",
                size: 14,
              },
            },
          },
          title: {
            display: true,
            text: "💰 Potential Savings by Category",
            color: "#f6d365",
            backgroundColor: "red",
            font: {
              size: 20,
              weight: "bold",
              family: "'Poppins', sans-serif",
            },
            padding: {
              top: 10,
              bottom: 20,
            },
          },
          tooltip: {
            callbacks: {
              label: (context) =>
                `You could have saved: $${context.raw.toFixed(2)}`,
            },
          },
          datalabels: {
            color: "#fff",
            anchor: "end",
            align: "top",
            formatter: (value) => (value > 0 ? `$${value}` : ""),
            font: {
              weight: "bold",
              size: 12,
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: "#fff",
              maxRotation: 0,
              minRotation: 0,
            },
            grid: {
              color: "rgba(255,255,255,0.1)",
            },
          },
          y: {
            beginAtZero: true,
            ticks: { color: "#fff" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
        },
      },
      plugins: [ChartDataLabels],
    });
  };

  const generateAnalysis = () => {
    const income = parseFloat(financialData.Income) || 0;
    const desiredSavings = parseFloat(financialData.Desired_Savings) || 0;
    const disposableIncome = parseFloat(financialData.Disposable_Income) || 0;

    const expenseCategories = [
      "Groceries",
      "Transport",
      "Eating_Out",
      "Entertainment",
      "Utilities",
      "Healthcare",
      "Education",
      "Miscellaneous",
    ];

    const expenses = expenseCategories.reduce(
      (sum, cat) => sum + (parseFloat(financialData[cat]) || 0),
      0
    );

    const calculatedSaving = income - expenses;
    const totalSaving = Math.min(calculatedSaving, disposableIncome);

    const savingsRate =
      income > 0 ? ((totalSaving / income) * 100).toFixed(1) : "0";

    let message = `Based on your financial data: `;
    message += `Your monthly income is $${income.toFixed(2)}. `;
    message += `Your total expenses amount to $${expenses.toFixed(2)}. `;

    if (income > 0) {
      if (expenses > income) {
        message += `Warning: Your expenses exceed your income by $${(
          expenses - income
        ).toFixed(2)}. `;
      } else {
        message += `You're saving $${totalSaving.toFixed(
          2
        )} per month, which is a ${savingsRate}% savings rate. `;
      }
    }

    if (desiredSavings > 0) {
      if (totalSaving >= desiredSavings) {
        message += `Great job! You're meeting your desired savings goal of $${desiredSavings.toFixed(
          2
        )}. `;
      } else {
        const shortfall = desiredSavings - totalSaving;
        message += `You're $${shortfall.toFixed(
          2
        )} short of your desired savings goal. `;
      }
    }

    // Find top expense categories
    const topExpenses = expenseCategories
      .map((cat) => ({
        category: cat.replace("_", " "),
        amount: parseFloat(financialData[cat]) || 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .filter((item) => item.amount > 0)
      .slice(0, 3);

    if (topExpenses.length > 0) {
      message += `Your top expenses are: ${topExpenses
        .map((e) => `${e.category} ($${e.amount.toFixed(2)})`)
        .join(", ")}. `;
    }

    message +=
      disposableIncome > 0
        ? `You have $${disposableIncome.toFixed(
            2
          )} available as disposable income. `
        : `Consider reviewing your expenses as you have little disposable income.`;

    setAnalysisMessage(message);
    return message;
  };

  const speakAnalysis = () => {
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }

    const message = analysisMessage || generateAnalysis();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.voice = synthRef.current
      .getVoices()
      .find((voice) => voice.name.includes("Google US English"));
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    synthRef.current.speak(utterance);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("financialData");
    setUser(null);
    setError("");
    setShowFinancialForm(false);
    setShowAnalysis(false);
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }
  };

  if (user) {
    return (
      <div style={styles.container}>
        <div style={styles.glassCard}>
          {!showFinancialForm && !showAnalysis ? (
            <>
              <h2 style={styles.welcomeText}>
                Welcome back, <span style={styles.highlight}>{user.name}</span>
              </h2>

              <button
                onClick={() => setShowFinancialForm(true)}
                style={styles.primaryButton}
                className="hover-effect"
              >
                {Object.values(financialData).some((val) => val !== "")
                  ? "✏️ Update Financial Information"
                  : "💰 Add Financial Information"}
              </button>

              {Object.values(financialData).some((val) => val !== "") && (
                <button
                  onClick={() => setShowAnalysis(true)}
                  style={styles.secondaryButton}
                  className="hover-effect"
                >
                  📊 View Financial Analysis
                </button>
              )}

              <button
                onClick={handleLogout}
                style={styles.tertiaryButton}
                className="hover-effect"
              >
                👋 Logout
              </button>
            </>
          ) : showFinancialForm ? (
            <div style={styles.financialForm}>
              <h3 style={styles.formHeader}>Financial Information</h3>

              <div style={styles.section}>
                <h4 style={styles.sectionHeader}>Basic Information</h4>
                <div style={styles.gridContainer}>
                  {[
                    "Income",
                    "Age",
                    "Dependents",
                    "Disposable_Income",
                    "Desired_Savings",
                  ].map((field) => (
                    <div key={field} style={styles.inputGroup}>
                      <label style={styles.label}>
                        {field.replace("_", " ")}
                      </label>
                      <input
                        type="number"
                        name={field}
                        value={financialData[field]}
                        onChange={handleFinancialChange}
                        style={styles.input}
                        placeholder={`Enter ${field.replace("_", " ")}`}
                      />
                    </div>
                  ))}
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Occupation</label>
                    <select
                      name="Occupation"
                      value={financialData.Occupation}
                      onChange={handleFinancialChange}
                      style={styles.input}
                      className="custom-select"
                    >
                      <option value="">Select Occupation</option>
                      <option value="Salaried">Salaried</option>
                      <option value="Self-Employed">Self-Employed</option>
                      <option value="Student">Student</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>

                  {/* City Tier Dropdown */}
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>City Tier</label>
                    <select
                      name="City_Tier"
                      value={financialData.City_Tier}
                      onChange={handleFinancialChange}
                      style={styles.input}
                      className="custom-select"
                    >
                      <option value="">Select City Tier</option>
                      <option value="Tier 1">Tier 1</option>
                      <option value="Tier 2">Tier 2</option>
                      <option value="Tier 3">Tier 3</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={styles.section}>
                <h4 style={styles.sectionHeader}>Monthly Expenses</h4>
                <div style={styles.gridContainer}>
                  {[
                    "Groceries",
                    "Transport",
                    "Eating_Out",
                    "Entertainment",
                    "Utilities",
                    "Healthcare",
                    "Education",
                    "Miscellaneous",
                  ].map((field) => (
                    <div key={field} style={styles.inputGroup}>
                      <label style={styles.label}>
                        {field.replace("_", " ")}
                      </label>
                      <input
                        type="number"
                        name={field}
                        value={financialData[field]}
                        onChange={handleFinancialChange}
                        style={styles.input}
                        placeholder={`Enter ${field.replace("_", " ")}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.buttonGroup}>
                <button
                  onClick={handleFinancialSubmit}
                  style={styles.primaryButton}
                  className="hover-effect"
                >
                  💾 Save Financial Data
                </button>

                <button
                  onClick={() => setShowFinancialForm(false)}
                  style={styles.secondaryButton}
                  className="hover-effect"
                >
                  ↩️ Back to Dashboard
                </button>
              </div>
            </div>
          ) : (
            showAnalysis && (
              <div style={styles.analysisContainer}>
                <h2 style={styles.analysisHeader}>Your Financial Analysis</h2>

                <div style={styles.chartContainer}>
                  <div style={styles.chartWrapper}>
                    <canvas id="expensePieChart" style={styles.chart}></canvas>
                    <div
                      id="customPieLegend"
                      style={{ marginTop: "20px" }}
                    ></div>
                  </div>
                  <div style={styles.chartWrapper}>
                    <canvas id="incomeBarChart" style={styles.chart}></canvas>
                  </div>
                  <div style={styles.chartWrapper}>
                    <canvas id="comparisonChart" style={styles.chart}></canvas>
                  </div>
                </div>

                <div style={styles.analysisCard}>
                  <h3 style={styles.analysisSubheader}>Key Insights</h3>
                  <p style={styles.analysisText}>{analysisMessage}</p>
                  {/* {localStorage.getItem("podcastScript") && (
  <div style={{ marginTop: "20px" }}>
    <h4 style={{ color: "#f6d365" }}>🎙️ Personalized Podcast Script</h4>
    <pre style={{ whiteSpace: "pre-wrap", color: "#eee", fontSize: "1rem", marginTop: "10px" }}>
      {localStorage.getItem("podcastScript")}
    </pre>

    <div style={{ margin: "15px 0" }}>
      <label style={{ color: "#fff", marginRight: "10px" }}>Select Language:</label>
      <select
        value={selectedLang}
        onChange={(e) => setSelectedLang(e.target.value)}
        style={styles.input}
      >
        <option value="en">English</option>
        <option value="hi">Hindi</option>
      </select>
    </div>

    <div style={styles.audioControls}>
      <button
        onClick={async () => {
          try {
            setLoadingAudio(true);
            const res = await fetch(`http://localhost:5001/api/finance/podcast/audio?language=${selectedLang}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
              },
              body: JSON.stringify({
                podcast_script: localStorage.getItem("podcastScript")
              })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Audio fetch failed");

            const audioUrl = `http://localhost:5001${data.audio_url}`;
            localStorage.setItem(`${selectedLang}_audio_url`, audioUrl);
            setLoadingAudio(false);
          } catch (err) {
            console.error("Audio fetch error:", err.message);
            setLoadingAudio(false);
          }
        }}
        style={styles.audioButton}
        className="hover-effect"
        disabled={loadingAudio}
      >
        {loadingAudio
          ? "⏳ Generating..."
          : `🎧 Generate ${selectedLang === "hi" ? "Hindi" : "English"} Audio`}
      </button>

      {localStorage.getItem(`${selectedLang}_audio_url`) && !loadingAudio && (
  <div style={styles.audioControls}>
    <button
      onClick={() => {
        const audio = new Audio(localStorage.getItem(`${selectedLang}_audio_url`));
        audio.play();
      }}
      style={styles.audioButton}
      className="hover-effect"
    >
      ▶️ Play {selectedLang === "hi" ? "Hindi" : "English"}
    </button>

    <button
      onClick={() => {
        const audio = new Audio(localStorage.getItem(`${selectedLang}_audio_url`));
        audio.pause();
        audio.currentTime = 0;
      }}
      style={styles.audioButtonStop}
      className="hover-effect"
    >
      ⏹️ Stop {selectedLang === "hi" ? "Hindi" : "English"}
    </button>

    <a
      href={localStorage.getItem(`${selectedLang}_audio_url`)}
      download
      style={{ ...styles.audioButton, textDecoration: "none" }}
      className="hover-effect"
    >
      💾 Download {selectedLang === "hi" ? "Hindi" : "English"} MP3
    </a>
  </div>
)}

    </div>
  </div>
)} */}

                  {/* <button
        onClick={() => {
          if (hindiAudioRef.current) {
            hindiAudioRef.current.pause();
            hindiAudioRef.current.currentTime = 0;
          }
        }}
        style={styles.audioButtonStop}
        className="hover-effect"
      >
        ⏹️ Hindi Stop
      </button>

      <a
        href={localStorage.getItem("hindiAudioUrl")}
        download
        style={{ ...styles.audioButton, textDecoration: "none" }}
        className="hover-effect"
      >
        💾 Download Hindi MP3
      </a> */}
                </div>
                {localStorage.getItem("podcastScript") && (
                  <div style={{ marginTop: "20px" }}>
                    <h4 style={{ color: "#f6d365" }}>
                      🎙️ Personalized Podcast Script
                    </h4>
                    <pre
                      style={{
                        whiteSpace: "pre-wrap",
                        color: "#eee",
                        fontSize: "1rem",
                        marginTop: "10px",
                      }}
                    >
                      {localStorage.getItem("podcastScript")}
                    </pre>

                    <div style={{ margin: "15px 0" }}>
                      <label style={{ color: "#fff", marginRight: "10px" }}>
                        Select Language:
                      </label>
                      <select
                        value={selectedLang}
                        onChange={(e) => setSelectedLang(e.target.value)}
                        style={{
                          backgroundColor: "#322c4a", // ⬅️ dark purple background
                          color: "#000000", // ⬅️ yellow text
                          padding: "10px",
                          border: "1px solid #888",
                          borderRadius: "8px",
                          fontSize: "1rem",
                          width: "100%", // optional full width
                          appearance: "none", // removes default arrow (style manually if needed)
                        }}
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="kn">Kannada</option>
                      </select>
                    </div>

                    <div style={styles.audioControls}>
                      <button
                        onClick={async () => {
                          try {
                            setLoadingAudio(true);
                            const res = await fetch(
                              `http://localhost:5001/api/finance/podcast/audio?language=${selectedLang}`,
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${localStorage.getItem(
                                    "token"
                                  )}`,
                                },
                                body: JSON.stringify({
                                  podcast_script:
                                    localStorage.getItem("podcastScript"),
                                }),
                              }
                            );

                            const data = await res.json();
                            if (!res.ok)
                              throw new Error(
                                data.error || "Audio fetch failed"
                              );

                            const audioUrl = `http://localhost:5001${data.audio_url}`;
                            localStorage.setItem(
                              `${selectedLang}_audio_url`,
                              audioUrl
                            );
                            setLoadingAudio(false);
                          } catch (err) {
                            console.error("Audio fetch error:", err.message);
                            setLoadingAudio(false);
                          }
                        }}
                        style={styles.audioButton}
                        className="hover-effect"
                        disabled={loadingAudio}
                      >
                        {loadingAudio ? (
                          "⏳ Generating..."
                        ) : (
                          <>
                            🎧 Generate{" "}
                            {selectedLang === "hi"
                              ? "Hindi"
                              : selectedLang === "kn"
                              ? "Kannada"
                              : "English"}{" "}
                            Audio
                          </>
                        )}
                      </button>

                      {localStorage.getItem(`${selectedLang}_audio_url`) &&
                        !loadingAudio && (
                          <>
                            <button
                              onClick={() => {
                                const audio = new Audio(
                                  localStorage.getItem(
                                    `${selectedLang}_audio_url`
                                  )
                                );
                                audio.play();
                              }}
                              style={styles.audioButton}
                              className="hover-effect"
                            >
                              ▶️ Play{" "}
                              {selectedLang === "hi" ? "Hindi" : "English"}
                            </button>

                            <button
                              onClick={() => {
                                const audio = new Audio(
                                  localStorage.getItem(
                                    `${selectedLang}_audio_url`
                                  )
                                );
                                audio.pause();
                                audio.currentTime = 0;
                              }}
                              style={styles.audioButtonStop}
                              className="hover-effect"
                            >
                              ⏹️ Stop{" "}
                              {selectedLang === "hi" ? "Hindi" : "English"}
                            </button>

                            <a
                              href={localStorage.getItem(
                                `${selectedLang}_audio_url`
                              )}
                              download
                              style={{
                                ...styles.audioButton,
                                textDecoration: "none",
                              }}
                              className="hover-effect"
                            >
                              💾 Download{" "}
                              {selectedLang === "hi" ? "Hindi" : "English"} MP3
                            </a>
                          </>
                        )}
                    </div>
                  </div>
                )}
                <div style={styles.buttonGroup}>
                  <button
                    onClick={() => {
                      setShowAnalysis(false);
                      synthRef.current.cancel();
                    }}
                    style={styles.primaryButton}
                    className="hover-effect"
                  >
                    ↩️ Back to Dashboard
                  </button>

                  <button
                    onClick={() => {
                      setShowAnalysis(false);
                      setShowFinancialForm(true);
                      synthRef.current.cancel();
                    }}
                    style={styles.secondaryButton}
                    className="hover-effect"
                  >
                    ✏️ Edit Financial Data
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.authContainer}>
      <div style={styles.glassAuthCard} className="card-animation">
        <div style={styles.logoContainer}>
          <h1 style={styles.logoText}>Freedom Fund</h1>
        </div>
        <h2 style={styles.authHeader}>
          {isRegister ? "Create Account" : "Welcome Back!"}
          <div style={styles.underline}></div>
        </h2>

        {isRegister && (
          <div style={styles.inputGroup}>
            <label style={styles.label}>Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={form.name}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        )}

        <div style={styles.inputGroup}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            style={styles.input}
          />
        </div>

        <button
          onClick={handleSubmit}
          style={styles.primaryButton}
          disabled={loading}
          className="hover-effect"
        >
          {loading
            ? "⏳ Please wait..."
            : isRegister
            ? "🚀 Register"
            : "🔑 Login"}
        </button>

        {error && <div style={styles.errorMessage}>⚠️ {error}</div>}

        <p
          onClick={() => {
            setIsRegister(!isRegister);
            setError("");
            setForm({ name: "", email: "", password: "" });
          }}
          style={styles.toggleText}
        >
          {isRegister
            ? "Already have an account? Login here"
            : "Don't have an account? Register now"}
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "20px",
    fontFamily: "'Poppins', sans-serif",
  },
  authContainer: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "20px",
    fontFamily: "'Poppins', sans-serif",
  },
  logoContainer: {
    marginBottom: "20px",
  },
  logoText: {
    fontSize: "48px",
    //fontWeight: 'bold',
    color: "#ffffff",
    //fontFamily: 'Georgia, serif', // or your brand font
    textShadow: "2px 2px 6px rgba(0,0,0,0.4)",
  },
  input: {
    width: "100%",
    padding: "12px 15px",
    borderRadius: "10px",
    border: "none",
    background: "rgba(255,255,255,0.2)",
    color: "#fff",
    fontSize: "1rem",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    appearance: "none", // removes default arrow styling (optional)
  },
  glassCard: {
    background: "rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    padding: "40px",
    width: "100%",
    maxWidth: "900px",
    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    transition: "all 0.3s ease",
  },
  glassAuthCard: {
    background: "rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    padding: "40px",
    width: "100%",
    maxWidth: "450px",
    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    transition: "all 0.3s ease",
    animation: "fadeIn 0.5s ease-in-out",
  },
  welcomeText: {
    color: "#fff",
    fontSize: "2.5rem",
    marginBottom: "30px",
    textAlign: "center",
    fontWeight: "600",
    textShadow: "1px 1px 3px rgba(0,0,0,0.2)",
  },
  highlight: {
    color: "#f6d365",
    fontWeight: "700",
  },
  formHeader: {
    color: "#fff",
    fontSize: "2rem",
    marginBottom: "20px",
    textAlign: "center",
    fontWeight: "600",
  },
  authHeader: {
    color: "#fff",
    fontSize: "2rem",
    marginBottom: "30px",
    textAlign: "center",
    fontWeight: "600",
    position: "relative",
  },
  underline: {
    height: "4px",
    width: "80px",
    background: "linear-gradient(to right, #f6d365, #fda085)",
    margin: "10px auto 0",
    borderRadius: "2px",
  },
  sectionHeader: {
    color: "#fff",
    fontSize: "1.3rem",
    margin: "20px 0 15px",
    fontWeight: "500",
    borderBottom: "2px solid rgba(255,255,255,0.2)",
    paddingBottom: "8px",
  },
  inputGroup: {
    marginBottom: "15px",
    width: "100%",
  },
  label: {
    display: "block",
    color: "#fff",
    marginBottom: "8px",
    fontSize: "0.9rem",
    fontWeight: "500",
  },
  input: {
    width: "100%",
    padding: "12px 15px",
    borderRadius: "10px",
    border: "none",
    background: "rgba(255,255,255,0.2)",
    color: "#fff",
    fontSize: "1rem",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  primaryButton: {
    background: "linear-gradient(to right, #f6d365 0%, #fda085 100%)",
    color: "#fff",
    border: "none",
    padding: "14px 20px",
    borderRadius: "10px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%",
    marginBottom: "15px",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
  },
  secondaryButton: {
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.3)",
    padding: "14px 20px",
    borderRadius: "10px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%",
    marginBottom: "15px",
    transition: "all 0.3s ease",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
  },
  tertiaryButton: {
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.2)",
    padding: "14px 20px",
    borderRadius: "10px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%",
    marginBottom: "15px",
    transition: "all 0.3s ease",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
  },
  buttonGroup: {
    display: "flex",
    gap: "15px",
    marginTop: "30px",
  },
  financialForm: {
    width: "100%",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "20px",
    width: "100%",
  },
  analysisContainer: {
    width: "100%",
    color: "#fff",
  },
  analysisHeader: {
    fontSize: "2rem",
    marginBottom: "30px",
    textAlign: "center",
    fontWeight: "600",
    color: "#fff",
  },
  analysisSubheader: {
    fontSize: "1.5rem",
    marginBottom: "20px",
    fontWeight: "600",
    color: "#f6d365",
  },
  analysisText: {
    fontSize: "1.1rem",
    lineHeight: "1.6",
    marginBottom: "20px",
  },
  analysisCard: {
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "15px",
    padding: "25px",
    margin: "30px 0",
    backdropFilter: "blur(5px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
  },
  chartContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "30px",
  },
  chartWrapper: {
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "15px",
    padding: "20px",
    backdropFilter: "blur(5px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    display: "flex", // ➕ Add this
    flexDirection: "row", // ➕ Add this
    justifyContent: "space-between", // ➕ Optional
  },

  chart: {
    width: "100%",
    height: "100%",
  },
  audioControls: {
    display: "flex",
    gap: "15px",
    marginTop: "20px",
  },
  audioButton: {
    background: "linear-gradient(to right, #4facfe 0%, #00f2fe 100%)",
    color: "#fff",
    border: "none",
    padding: "12px 20px",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  audioButtonStop: {
    background: "linear-gradient(to right, #ff758c 0%, #ff7eb3 100%)",
    color: "#fff",
    border: "none",
    padding: "12px 20px",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  errorMessage: {
    color: "#ff6b6b",
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: "12px",
    borderRadius: "8px",
    margin: "15px 0",
    textAlign: "center",
    fontSize: "0.9rem",
  },
  toggleText: {
    color: "#fff",
    textAlign: "center",
    marginTop: "20px",
    cursor: "pointer",
    opacity: "0.8",
    transition: "all 0.3s ease",
    fontSize: "0.95rem",
  },
  section: {
    marginBottom: "30px",
  },
};

// Global styles
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Poppins', sans-serif;
  }

  input:focus, select:focus {
    outline: none;
    background: rgba(255,255,255,0.3) !important;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;
  }

  .hover-effect:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.15) !important;
  }

  .hover-effect:active {
    transform: translateY(0);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .card-animation {
    animation: fadeIn 0.5s ease-in-out;
  }

  .custom-select option {
    background-color: rgba(50, 50, 50, 0.9);
    color: #fff;
  }
`;

// Add the global styles to the document head
const styleElement = document.createElement("style");
styleElement.innerHTML = globalStyles;
document.head.appendChild(styleElement);
