// Инициализация анимаций
AOS.init({ duration: 1000, once: true });

// Инициализация max значения для downPaymentSlider
document.addEventListener('DOMContentLoaded', function() {
  const loanAmount = parseFloat(document.getElementById('loanAmount').value);
  document.getElementById('downPaymentSlider').max = loanAmount;
});

// Синхронизация ползунков и полей ввода
document.getElementById('loanAmount').addEventListener('input', function() {
  document.getElementById('loanAmountSlider').value = this.value;
});

document.getElementById('loanAmountSlider').addEventListener('input', function() {
  document.getElementById('loanAmount').value = this.value;
});

document.getElementById('interestRate').addEventListener('input', function() {
  document.getElementById('interestRateSlider').value = this.value;
});

document.getElementById('interestRateSlider').addEventListener('input', function() {
  document.getElementById('interestRate').value = this.value;
});

document.getElementById('loanTerm').addEventListener('input', function() {
  document.getElementById('loanTermSlider').value = this.value;
});

document.getElementById('loanTermSlider').addEventListener('input', function() {
  document.getElementById('loanTerm').value = this.value;
});

document.getElementById('downPayment').addEventListener('input', function() {
  document.getElementById('downPaymentSlider').value = this.value;
});

document.getElementById('downPaymentSlider').addEventListener('input', function() {
  document.getElementById('downPayment').value = this.value;
});

// Синхронизация max значения для downPaymentSlider с loanAmount
document.getElementById('loanAmount').addEventListener('input', function() {
  const loanAmount = parseFloat(this.value);
  document.getElementById('downPaymentSlider').max = loanAmount;
  const downPayment = parseFloat(document.getElementById('downPayment').value);
  if (downPayment > loanAmount) {
    document.getElementById('downPayment').value = loanAmount;
    document.getElementById('downPaymentSlider').value = loanAmount;
  }
});

document.getElementById('loanAmountSlider').addEventListener('input', function() {
  const loanAmount = parseFloat(this.value);
  document.getElementById('downPaymentSlider').max = loanAmount;
  const downPayment = parseFloat(document.getElementById('downPayment').value);
  if (downPayment > loanAmount) {
    document.getElementById('downPayment').value = loanAmount;
    document.getElementById('downPaymentSlider').value = loanAmount;
  }
});

// Функция расчета ипотеки
function calculateMortgage(loanAmount, interestRate, loanTerm, downPayment) {
  const principal = loanAmount - downPayment;
  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = loanTerm * 12;

  if (monthlyRate === 0) {
    return {
      monthlyPayment: principal / numberOfPayments,
      totalPayment: principal,
      totalInterest: 0,
      loanAmount: principal
    };
  }

  const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  const totalPayment = monthlyPayment * numberOfPayments;
  const totalInterest = totalPayment - principal;

  return {
    monthlyPayment: monthlyPayment,
    totalPayment: totalPayment,
    totalInterest: totalInterest,
    loanAmount: principal
  };
}

// Обработчик формы
document.getElementById('mortgageForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const loanAmount = parseFloat(document.getElementById('loanAmount').value);
  const interestRate = parseFloat(document.getElementById('interestRate').value);
  const loanTerm = parseInt(document.getElementById('loanTerm').value);
  const downPayment = parseFloat(document.getElementById('downPayment').value);

  const results = calculateMortgage(loanAmount, interestRate, loanTerm, downPayment);

  document.getElementById('monthlyPayment').textContent = results.monthlyPayment.toLocaleString('ru-RU') + ' ₽';
  document.getElementById('totalPayment').textContent = results.totalPayment.toLocaleString('ru-RU') + ' ₽';
  document.getElementById('totalInterest').textContent = results.totalInterest.toLocaleString('ru-RU') + ' ₽';
  document.getElementById('loanAmountResult').textContent = results.loanAmount.toLocaleString('ru-RU') + ' ₽';

  document.getElementById('results').classList.remove('d-none');
  document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
});

// Автоматический расчет при изменении значений
['loanAmount', 'interestRate', 'loanTerm', 'downPayment', 'loanAmountSlider', 'interestRateSlider', 'loanTermSlider', 'downPaymentSlider'].forEach(id => {
  document.getElementById(id).addEventListener('input', function() {
    if (document.getElementById('results').classList.contains('d-none')) return;

    const loanAmount = parseFloat(document.getElementById('loanAmount').value);
    const interestRate = parseFloat(document.getElementById('interestRate').value);
    const loanTerm = parseInt(document.getElementById('loanTerm').value);
    const downPayment = parseFloat(document.getElementById('downPayment').value);

    const results = calculateMortgage(loanAmount, interestRate, loanTerm, downPayment);

    document.getElementById('monthlyPayment').textContent = results.monthlyPayment.toLocaleString('ru-RU') + ' ₽';
    document.getElementById('totalPayment').textContent = results.totalPayment.toLocaleString('ru-RU') + ' ₽';
    document.getElementById('totalInterest').textContent = results.totalInterest.toLocaleString('ru-RU') + ' ₽';
    document.getElementById('loanAmountResult').textContent = results.loanAmount.toLocaleString('ru-RU') + ' ₽';
  });
});
