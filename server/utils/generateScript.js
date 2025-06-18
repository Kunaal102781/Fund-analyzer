const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.generateScript = async (input, output) => {
  const name = 'Rohan'; // Optional: can randomize or ask from frontend
  const age = input.Age;
  const income = input.Income;
  const disposable = input.Disposable_Income;
  const desiredSavings = input.Desired_Savings;

  // Format output to readable savings list
  const savingsLines = Object.entries(output)
    .map(([k, v]) => {
      const label = k.replace("Potential_Savings_", "").replace(/_/g, " ");
      return `- **${label}**: ₹${v.toFixed(2)}`;
    })
    .join('\n');

const prompt = `
You are a podcast host for "Money Matters", a personal finance show. Write a ~2-minute episode in the style below:

Start with:
- Host intro: Welcome listener, age ${age}, earning ₹${income}, with ₹${disposable} disposable income, aiming to save ₹${desiredSavings}.
- Say: “Our ML analysis revealed the following potential monthly savings:”

Insert:
${savingsLines}

Then explain:
- If savings are erratic or inconsistent, say that
- Provide a "Financial Health Score" between 0–100 (you can make it up or derive from savings consistency)
- Assign them a "Cluster Group" (1, 2, or 3) based on savings (you can create logic)

Finally:
- List 3 to 5 practical, customized tips based on their situation. Always include tips about starting a SIP or investing in mutual funds or stocks.
- End with a motivational send-off.

Use clear, friendly tone. Markdown formatting: **bold** for host statements.
`;



  const response = await openai.chat.completions.create({
    model: "gpt-4",
    temperature: 1.5,
    messages: [{ role: "user", content: prompt }]
  });

  return response.choices[0].message.content;
};
