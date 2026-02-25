// 各單位的基準轉換率 (以第一項為基準 1)
const units = {
  length: {
    m: { name: '公尺 (m)', rate: 1 },
    cm: { name: '公分 (cm)', rate: 0.01 },
    km: { name: '公里 (km)', rate: 1000 },
    in: { name: '英吋 (in)', rate: 0.0254 },
    ft: { name: '英呎 (ft)', rate: 0.3048 }
  },
  weight: {
    kg: { name: '公斤 (kg)', rate: 1 },
    g: { name: '公克 (g)', rate: 0.001 },
    lb: { name: '磅 (lb)', rate: 0.453592 },
    oz: { name: '盎司 (oz)', rate: 0.0283495 },
    tjin: { name: '台斤', rate: 0.6 },
    tliang: { name: '台兩', rate: 0.0375 }
  },
  volume: {
    l: { name: '公升 (L)', rate: 1 },
    ml: { name: '毫升 (mL)', rate: 0.001 },
    gal: { name: '加侖 (gal)', rate: 3.78541 }
  },
  area: {
    sqm: { name: '平方公尺 (m²)', rate: 1 },
    ha: { name: '公頃 (ha)', rate: 10000 },
    sqft: { name: '平方英呎 (sqft)', rate: 0.092903 },
    ping: { name: '坪', rate: 3.305785 },
    jia: { name: '甲', rate: 9699.17 }
  },
  speed: {
    kmh: { name: '公里/時 (km/h)', rate: 1 },
    mph: { name: '英哩/時 (mph)', rate: 1.60934 }
  },
  currency: {} // 動態載入
};

// 每日自動更新匯率功能
async function updateCurrencyRates() {
  const today = new Date().toISOString().split('T')[0];
  const storedDate = localStorage.getItem('currencyDate');
  let rates = JSON.parse(localStorage.getItem('currencyRates'));
  const statusText = document.getElementById('update-status');

  // 如果記錄的日期不是今天，或是完全沒資料，就呼叫免 API Key 的匯率服務
  if (storedDate !== today || !rates) {
    try {
      statusText.innerText = "正在更新今日匯率...";
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      rates = data.rates;
      localStorage.setItem('currencyRates', JSON.stringify(rates));
      localStorage.setItem('currencyDate', today);
      statusText.innerText = `匯率最後更新: ${today}`;
    } catch (e) {
      statusText.innerText = "離線狀態，使用歷史匯率";
      if (!rates) return; // 完全沒網路也沒歷史記錄就放棄
    }
  } else {
    statusText.innerText = `匯率最後更新: ${storedDate}`;
  }

  // 設定支援的貨幣
  const commonCurrencies = {
    TWD: '台幣 (TWD)', USD: '美元 (USD)', JPY: '日圓 (JPY)', 
    EUR: '歐元 (EUR)', GBP: '英鎊 (GBP)', KRW: '韓元 (KRW)', CNY: '人民幣 (CNY)'
  };

  // 以 USD 為基準轉換率寫入 units 中
  for (let code in commonCurrencies) {
    if (rates[code]) {
      units.currency[code] = { name: commonCurrencies[code], rate: 1 / rates[code] };
    }
  }
}

// 綁定 UI 元素與計算邏輯
const categorySelect = document.getElementById('category');
const unit1Select = document.getElementById('unit1');
const unit2Select = document.getElementById('unit2');
const input1 = document.getElementById('input1');
const input2 = document.getElementById('input2');

function populateUnits() {
  const cat = categorySelect.value;
  const currentUnits = units[cat];
  unit1Select.innerHTML = '';
  unit2Select.innerHTML = '';
  
  for (let key in currentUnits) {
    unit1Select.add(new Option(currentUnits[key].name, key));
    unit2Select.add(new Option(currentUnits[key].name, key));
  }
  if (unit2Select.options.length > 1) unit2Select.selectedIndex = 1;
  calculate1to2();
}

function calculate1to2() {
  const cat = categorySelect.value;
  if (!units[cat][unit1Select.value]) return;
  const rate1 = units[cat][unit1Select.value].rate;
  const rate2 = units[cat][unit2Select.value].rate;
  const val = parseFloat(input1.value);
  input2.value = isNaN(val) ? '' : +((val * rate1 / rate2).toFixed(6));
}

function calculate2to1() {
  const cat = categorySelect.value;
  const rate1 = units[cat][unit1Select.value].rate;
  const rate2 = units[cat][unit2Select.value].rate;
  const val = parseFloat(input2.value);
  input1.value = isNaN(val) ? '' : +((val * rate2 / rate1).toFixed(6));
}

categorySelect.addEventListener('change', populateUnits);
unit1Select.addEventListener('change', calculate1to2);
unit2Select.addEventListener('change', calculate1to2);
input1.addEventListener('input', calculate1to2);
input2.addEventListener('input', calculate2to1);

// 初始化
async function init() {
  await updateCurrencyRates();
  populateUnits();
}
init();
