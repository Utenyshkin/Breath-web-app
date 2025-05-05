// Получение элементов управления
const playBtn = document.getElementById('play-btn');
const timerBtn = document.getElementById('timer-btn');
const settingsBtn = document.getElementById('settings-btn');
const currentPhase = document.getElementById('current-phase');
const selectedDuration = document.getElementById('selected-duration');
const meditationTypeEl = document.getElementById('meditation-type');

// Попапы
const durationPopup = document.getElementById('duration-popup');
const typePopup = document.getElementById('type-popup');

// Значения размеров кругов
const initialSizes = [376, 328, 280, 232, 168];
const inhaleStartSizes = [268, 236, 204, 172, 140];
const inhaleEndSizes = [456, 392, 328, 264, 184];

// Переменные состояния
let meditationActive = false;
let isPaused = false;
let meditationType = 'relax';
let selectedTypeValue = 'relax';
let duration = 5; // в минутах
let selectedDurationValue = 5;
let phaseIndex = 0;
let intervalId = null;
let phaseIntervalId = null;
let totalTime = 0;
let elapsedTime = 0;

const types = {
    relax: [
        { name: 'Вдох', time: 5 },
        { name: 'Задержка', time: 5 },
        { name: 'Выдох', time: 5 },
        { name: 'Задержка', time: 5 },
    ],
    focus: [
        { name: 'Вдох', time: 5 },
        { name: 'Выдох', time: 5 },
        { name: 'Задержка', time: 5 },
    ]
};

function getPhasePatternText(typeKey) {
    return types[typeKey]
        .map(phase => phase.time)
        .join(' • ');
}

function startProgress(durationMs) {
    const circle = document.querySelector('.progress-ring-circle');
    const container = document.getElementById('progress-container');

    const radius = 28;
    const circumference = 2 * Math.PI * radius;

    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference;
    circle.style.transition = `stroke-dashoffset ${durationMs}ms linear`;

    container.style.display = 'block';

    requestAnimationFrame(() => {
        circle.style.strokeDashoffset = '0';
    });
}

function resetProgress() {
    const circle = document.querySelector('.progress-ring-circle');
    const container = document.getElementById('progress-container');

    circle.style.transition = 'none';
    circle.style.strokeDashoffset = 2 * Math.PI * 48;
    container.style.display = 'none';
}

function setCircleSizes(sizes, withBounce = false, duration = 1000) {
    const ellipses = [
        document.querySelector('.ellipse-1'),
        document.querySelector('.ellipse-2'),
        document.querySelector('.ellipse-3'),
        document.querySelector('.ellipse-4'),
        document.querySelector('.ellipse-5'),
    ];

    const timing = withBounce
        ? 'cubic-bezier(0.34, 1.56, 0.64, 1)'
        : 'ease-in-out';

    ellipses.forEach((el, i) => {
        const size = sizes[i];

        // Сброс предыдущего transition, если он был длинным
        el.style.transition = 'none';
        void el.offsetWidth; // форсируем reflow

        // Устанавливаем новый transition
        el.style.transition = `width ${duration}ms ${timing}, height ${duration}ms ${timing}`;

        // Устанавливаем размеры
        el.style.width = size + 'px';
        el.style.height = size + 'px';
    });
}

function updateSelectedDuration() {
    selectedDuration.textContent = `${duration}:00`;
}

function togglePlayPause(isPlaying) {
    const icon = playBtn.querySelector('.icon-play');

    if (isPlaying && !isPaused) {
        icon.src = 'img/pause-icon.svg';
        playBtn.classList.add('pause');
        playBtn.classList.remove('play');

        timerBtn.classList.add('disabled');
        settingsBtn.classList.add('disabled');
        timerBtn.style.transform = 'translateX(48px)';
        settingsBtn.style.transform = 'translateX(-48px)';
        timerBtn.style.opacity = '0';
        settingsBtn.style.opacity = '0';
    } else {
        icon.src = 'img/play-icon.svg';
        playBtn.classList.add('play');
        playBtn.classList.remove('pause');

        timerBtn.classList.remove('disabled');
        settingsBtn.classList.remove('disabled');
        timerBtn.style.transform = 'translateX(0)';
        settingsBtn.style.transform = 'translateX(0)';
        timerBtn.style.opacity = '1';
        settingsBtn.style.opacity = '1';
    }
}

function resetInterval() {
    clearInterval(phaseIntervalId);
    clearInterval(intervalId);
    phaseIntervalId = null;
    intervalId = null;
    meditationActive = false;
    isPaused = false;
    phaseIndex = 0;
    elapsedTime = 0;
    currentPhase.textContent = '';
    meditationTypeEl.textContent = meditationType === 'relax' ? 'Расслабление' : 'Концентрация';
    // Сброс кругов с bounce-эффектом
    setCircleSizes(initialSizes, true, 600);
    // Сброс кнопки
    togglePlayPause(false);
    // Сброс прогресс-индикатора
    resetProgress();
    // Запуск конфетти (если подключен скрипт)
    // if (typeof launchConfettiAtCenter === 'function') {
    //     launchConfettiAtCenter();
    // }
    // 🎉 Конфетти за кнопкой Play
    const playBtn = document.getElementById('play-btn');
    if (typeof launchConfettiBehindElement === 'function') {
        launchConfettiBehindElement(playBtn);
    }
}

function setTheme(themeName) {
    document.body.classList.remove('relaxation-theme', 'focus-theme');
    document.body.classList.add(`${themeName}-theme`);
}

function startMeditation() {
    const phases = types[meditationType];
    const totalPhaseTime = phases.reduce((acc, phase) => acc + phase.time, 0);
    totalTime = duration * 60;
    elapsedTime = 0;
    phaseIndex = 0;
    let cycleCount = Math.floor(totalTime / totalPhaseTime);

    setCircleSizes(inhaleStartSizes, true, 600);

    meditationTypeEl.textContent = 'Приготовьтесь';
    currentPhase.textContent = '3';
    let prepTime = 3;
    const prepIntervalId = setInterval(() => {
        if (isPaused) {
            clearInterval(prepIntervalId);
            return;
        }
        prepTime--;
        currentPhase.textContent = prepTime;
        if (prepTime <= 0) {
            clearInterval(prepIntervalId);
            meditationTypeEl.textContent = phases[phaseIndex].name;
            startProgress(duration * 60 * 1000);
            runPhase();
        }
    }, 1000);

    function runPhase() {
        if (cycleCount <= 0 || isPaused) return resetInterval();

        const phase = phases[phaseIndex];
        let timeLeft = phase.time;
        currentPhase.textContent = timeLeft;
        meditationTypeEl.textContent = phase.name;

        const ms = phase.time * 1000;

        if (phase.name === 'Вдох') {
            setCircleSizes(inhaleEndSizes, false, ms);
        } else if (phase.name === 'Выдох') {
            setCircleSizes(inhaleStartSizes, false, ms);
        }
        // фаза "Задержка" — не трогаем размеры

        phaseIntervalId = setInterval(() => {
            if (isPaused) {
                clearInterval(phaseIntervalId);
                return;
            }

            timeLeft--;
            elapsedTime++;
            currentPhase.textContent = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(phaseIntervalId);
                phaseIndex = (phaseIndex + 1) % phases.length;
                if (phaseIndex === 0) cycleCount--;
                if (cycleCount > 0) {
                    runPhase();
                } else {
                    resetInterval();
                }
            }
        }, 1000);
    }
}

playBtn.addEventListener('click', () => {
    if (!meditationActive) {
        meditationActive = true;
        isPaused = false;
        togglePlayPause(true);
        startMeditation();
    } else if (!isPaused) {
        isPaused = true;
        togglePlayPause(false);
        clearInterval(phaseIntervalId);
        phaseIntervalId = null;
        meditationTypeEl.textContent = meditationType === 'relax' ? 'Расслабление' : 'Концентрация';
        currentPhase.textContent = '';
        timerBtn.classList.remove('disabled');
        settingsBtn.classList.remove('disabled');
        setCircleSizes(initialSizes, true, 600);
        resetProgress();
    } else {
        isPaused = false;
        togglePlayPause(true);
        startMeditation();
    }
});

// Обработка открытия попапа продолжительности
function openPopup(popupId) {
    document.querySelectorAll('.popup').forEach(p => p.classList.remove('active'));
    // document.getElementById(popupId).classList.add('active');
    const popup = document.getElementById(popupId);
    popup.classList.remove('mobile', 'desktop');

    if (window.innerWidth <= 700) {
        popup.classList.add('mobile');
    } else {
        popup.classList.add('desktop');
    }

    popup.classList.add('active');
    document.body.classList.add('popup-open');
}

function closePopup(popupId) {
    document.getElementById(popupId).classList.remove('active');
    if (!document.querySelector('.popup.active')) {
        document.body.classList.remove('popup-open');
    }
}

timerBtn.addEventListener('click', () => {
    const popup = document.getElementById('duration-popup');
    if (popup.classList.contains('active')) {
        closePopup('duration-popup');
    } else {
        document.querySelectorAll('#duration-options > div').forEach(el => {
            el.classList.remove('cell');
            el.classList.add('div');
            el.innerHTML = `<div class="title-2">${el.textContent.trim()}</div>`;
        });
        const active = document.querySelector(`#duration-options > div[data-value="${duration}"]`);
        if (active) {
            active.classList.remove('div');
            active.classList.add('cell');
            active.innerHTML = `
        <div class="text-wrapper">${active.textContent.trim()}</div>
        <div class="check"></div>
      `;
            selectedDurationValue = duration;
        }
        openPopup('duration-popup');
    }
});

settingsBtn.addEventListener('click', () => {
    const popup = document.getElementById('type-popup');
    if (popup.classList.contains('active')) {
        closePopup('type-popup');
    } else {
        document.querySelectorAll('#type-options > div').forEach(el => {
            el.innerHTML = ''; // Очищаем заранее

            const value = el.dataset.value;
            const name = value === 'relax' ? 'Расслабление' : 'Концентрация';
            const pattern = getPhasePatternText(value);

            el.classList.remove('cell');
            el.classList.add('div');
            el.innerHTML = `
                <div class="label-group">
                    <div class="text-wrapper">${name}</div>
                    <div class="phase-pattern">${pattern}</div>
                </div>
            `;
        });

        const active = document.querySelector(`#type-options > div[data-value="${meditationType}"]`);
        if (active) {
            const value = active.dataset.value;
            const name = value === 'relax' ? 'Расслабление' : 'Концентрация';
            const pattern = getPhasePatternText(value);

            active.classList.remove('div');
            active.classList.add('cell');
            active.innerHTML = `
              <div class="label-group">
                <div class="text-wrapper">${name}</div>
                <div class="phase-pattern">${pattern}</div>
              </div>
              <div class="check"></div>
            `;

            selectedTypeValue = meditationType;
        }

        openPopup('type-popup');
    }
});

document.querySelectorAll('#duration-options > div').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('#duration-options > div').forEach(el => {
            el.classList.remove('cell');
            el.classList.add('div');
            el.innerHTML = `<div class="title-2">${el.textContent.trim()}</div>`;
        });
        option.classList.remove('div');
        option.classList.add('cell');
        option.innerHTML = `
      <div class="text-wrapper">${option.textContent.trim()}</div>
      <div class="check"></div>
    `;
        selectedDurationValue = parseInt(option.dataset.value);
    });
});

function applyDuration() {
    duration = selectedDurationValue;
    updateSelectedDuration();
    closePopup('duration-popup');
}

document.querySelectorAll('#type-options > div').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('#type-options > div').forEach(el => {
            const value = el.dataset.value;
            const name = value === 'relax' ? 'Расслабление' : 'Концентрация';
            const pattern = getPhasePatternText(value);

            el.classList.remove('cell');
            el.classList.add('div');
            el.innerHTML = `
                <div class="label-group">
                    <div class="text-wrapper">${name}</div>
                    <div class="phase-pattern">${pattern}</div>
                </div>
            `;
        });

        const value = option.dataset.value;
        const name = value === 'relax' ? 'Расслабление' : 'Концентрация';
        const pattern = getPhasePatternText(value);

        option.classList.remove('div');
        option.classList.add('cell');
        option.innerHTML = `
            <div class="label-group">
                <div class="text-wrapper">${name}</div>
                <div class="phase-pattern">${pattern}</div>
            </div>
            <div class="check"></div>
        `;

        selectedTypeValue = value;
    });
});

function applyType() {
    meditationType = selectedTypeValue;
    meditationTypeEl.textContent = document.querySelector(`#type-options > div[data-value="${meditationType}"] .text-wrapper`).textContent;
    setTheme(meditationType); // ← добавлено
    closePopup('type-popup');
}

updateSelectedDuration();
setTheme(meditationType);

document.addEventListener('click', (event) => {
    const activePopup = document.querySelector('.popup.active');
    if (!activePopup) return;

    const container = activePopup.querySelector('.popup-container');

    // Проверяем, был ли клик внутри popup-контейнера
    const clickedInsidePopup = container.contains(event.target);

    // Проверяем, был ли клик по одной из управляющих кнопок
    const clickedControlButton =
        event.target.closest('#timer-btn') ||
        event.target.closest('#settings-btn');

    if (!clickedInsidePopup && !clickedControlButton) {
        closePopup(activePopup.id);
    }
});
