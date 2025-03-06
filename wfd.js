// 初始化变量
let currentIndex = 0;
let questions = [];
let starredQuestions = new Set(JSON.parse(localStorage.getItem('starredQuestions') || '[]'));
let playCount = 2;
const audioPlayer = document.getElementById('audioPlayer');
const userInput = document.getElementById('userInput');
const submitBtn = document.getElementById('submitBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const starBtn = document.getElementById('starBtn');
const playBtn = document.getElementById('playBtn');
const showAnswerBtn = document.getElementById('showAnswerBtn');
const resultBox = document.querySelector('.result-box');
const questionNumbers = document.getElementById('questionNumbers');

// 加载题目数据
async function loadQuestions() {
  try {
    const response = await fetch('question/questions.json');
    questions = await response.json();
    createQuestionNumbers();
    loadQuestion(currentIndex);
    resultBox.style.display = 'none';
    showAnswerBtn.classList.add('hidden');
  } catch (error) {
    console.error('加载题目失败:', error);
  }
}

// 创建72题数字导航
function createQuestionNumbers() {
  questionNumbers.innerHTML = '';
  questions.forEach((_, index) => {
    const numBtn = document.createElement('button');
    numBtn.textContent = index + 1;
    numBtn.addEventListener('click', () => jumpToQuestion(index));
    numBtn.classList.add('question-num');
    if (starredQuestions.has(index)) {
      numBtn.classList.add('starred');
    }
    questionNumbers.appendChild(numBtn);
  });
}

// 跳转到指定题目
function jumpToQuestion(index) {
  currentIndex = index;
  playCount = 2;
  updatePlayCount();
  loadQuestion(currentIndex);
}

// 更新播放次数显示
function updatePlayCount() {
  document.getElementById('playCount').textContent = playCount;
}

// 加载指定题目
function loadQuestion(index) {
  if (index >= 0 && index < questions.length) {
    const question = questions[index];
    audioPlayer.src = question.audio;
    audioPlayer.load();
    userInput.value = '';
    resultBox.style.display = 'none';
    showAnswerBtn.classList.add('hidden');
    nextBtn.disabled = index === questions.length - 1;
    prevBtn.disabled = index === 0;
    playCount = 2;
    updatePlayCount();
    updateStarButton();
    updateQuestionNumbers();
  }
}

// 更新标星按钮状态
function updateStarButton() {
  // 标星按钮保持蓝色，不再改变样式
}

// 更新题目导航状态
function updateQuestionNumbers() {
  const numButtons = document.querySelectorAll('.question-num');
  numButtons.forEach((btn, index) => {
    // 重置样式
    btn.style.backgroundColor = '#ccc'; // 默认灰色
    btn.classList.remove('starred');
    
    // 当前题目
    if (index === currentIndex) {
      btn.style.backgroundColor = '#007bff'; // 当前题号蓝色
    }
    
    // 标星题目
    if (starredQuestions.has(index)) {
      btn.classList.add('starred');
      btn.style.backgroundColor = 'yellow'; // 标星题号黄色
    }
    
    // 如果是当前题目
    if (index === currentIndex) {
      btn.style.backgroundColor = '#007bff'; // 保持当前题号蓝色
      if (starredQuestions.has(index)) {
        btn.style.border = '2px solid yellow'; // 添加黄色边框表示标星
      } else {
        btn.style.border = ''; // 清除边框
      }
    }
  });
}

// 提交答案
function submitAnswer() {
  const userText = userInput.value.trim();
  const correctText = questions[currentIndex].english;
  
  const {
    userHighlight,
    correctHighlight,
    score,
    total,
    errorCount
  } = checkAnswer(correctText, userText);
  
  document.getElementById('userAnswerHighlight').innerHTML = userHighlight;
  document.getElementById('correctAnswerHighlight').innerHTML = correctHighlight;
  document.getElementById('scoreDisplay').textContent = `${score}/${total} (扣分: ${errorCount})`;
  document.getElementById('chineseTranslation').textContent = questions[currentIndex].chinese;
  
  resultBox.style.display = 'block';
  showAnswerBtn.classList.remove('hidden');
  nextBtn.disabled = false;
  prevBtn.disabled = false;
}

// 核心校验函数
function checkAnswer(correct, answer) {
  const clean = str => str.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  
  const correctWords = clean(correct).split(' ');
  const userWords = clean(answer).split(' ');
  
  const correctCount = new Map();
  correctWords.forEach(word => {
    correctCount.set(word.toLowerCase(), (correctCount.get(word.toLowerCase()) || 0) + 1);
  });

  const tempCount = new Map(correctCount);
  const errorWords = new Set();
  const userValid = [];

  userWords.forEach(word => {
    const lowerWord = word.toLowerCase();
    if (tempCount.get(lowerWord)) {
      tempCount.set(lowerWord, tempCount.get(lowerWord) - 1);
      userValid.push({ word, valid: true }); // 正确单词标记为有效
    } else {
      userValid.push({ word, valid: false }); // 多写单词标记为无效
    }
  });

  const missingWords = [];
  correctCount.forEach((count, word) => {
    const remaining = tempCount.get(word);
    if (remaining > 0) {
      missingWords.push(...Array(remaining).fill(word));
    }
  });

  const userHighlight = userValid.map(({ word, valid }) => {
    // 检查首字母大写
    const isFirstWord = userValid.indexOf({ word, valid }) === 0;
    const isCapitalized = isFirstWord ? word[0] === word[0].toUpperCase() : true;
    
    if (!valid) {
      return `<span class="extra-word">${word}</span>`; // 多写单词显示黑色
    }
    return isCapitalized 
      ? `<span class="correct-word">${word}</span>`
      : `<span class="wrong-word">${word}</span>`; // 首字母不大写显示红色
  }).join(' ');

  const correctHighlight = correctWords.map(word => 
    missingWords.includes(word.toLowerCase()) ? `<span class="missing-word">${word}</span>` : word
  ).join(' ');

  return {
    userHighlight,
    correctHighlight,
    score: Math.max(correctWords.length - (errorWords.size + missingWords.length), 0),
    total: correctWords.length,
    errorCount: missingWords.length // 只统计缺少的单词
  };
}

// 播放音频
function playAudio() {
  if (playCount > 0) {
    audioPlayer.play();
    playCount--;
    updatePlayCount();
    if (playCount === 0) {
      playBtn.disabled = true;
    }
  }
}

// 标星题目
function toggleStar() {
  if (starredQuestions.has(currentIndex)) {
    starredQuestions.delete(currentIndex);
  } else {
    starredQuestions.add(currentIndex);
  }
  updateStarButton();
  updateQuestionNumbers();
}

// 加载上一题
function prevQuestion() {
  currentIndex = (currentIndex - 1 + questions.length) % questions.length;
  loadQuestion(currentIndex);
}

// 加载下一题
function nextQuestion() {
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    playCount = 2;
    updatePlayCount();
    loadQuestion(currentIndex);
    nextBtn.disabled = currentIndex === questions.length - 1;
    prevBtn.disabled = false;
    updateQuestionNumbers(); // 确保更新题号显示
  }
}

// 事件监听
submitBtn.addEventListener('click', submitAnswer);
prevBtn.addEventListener('click', prevQuestion);
nextBtn.addEventListener('click', nextQuestion);
starBtn.addEventListener('click', toggleStar);
playBtn.addEventListener('click', playAudio);
showAnswerBtn.addEventListener('click', () => {
  resultBox.style.display = 'block';
  showAnswerBtn.classList.add('hidden');
});

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  loadQuestions();
});
