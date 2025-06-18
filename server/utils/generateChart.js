exports.generateChartData = (userInput, savingsOutput) => {
  const labels = [
    'Eating_Out',
    'Education',
    'Entertainment',
    'Groceries',
    'Healthcare',
    'Miscellaneous',
    'Transport',
    'Utilities'
  ];

  const actual = labels.map((label) => userInput[label]);
  const potential = labels.map((label) => savingsOutput[`Potential_Savings_${label}`]);

  return {
    labels,
    datasets: [
      {
        label: 'Actual Spending (₹)',
        data: actual,
        backgroundColor: 'rgba(255, 99, 132, 0.6)'
      },
      {
        label: 'Potential Savings (₹)',
        data: potential,
        backgroundColor: 'rgba(54, 162, 235, 0.6)'
      }
    ]
  };
};
