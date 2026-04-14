/**
 * SUNNYCARE MindWell — Psychological Tests Engine
 * Handles rendering, navigation, scoring, and GAS submission for PHQ-9, GAD-7, etc.
 */

class TestEngine {
  constructor(config) {
    this.testId = config.testId;
    this.questions = config.questions;
    this.options = config.options;
    this.scoringHandler = config.scoringHandler;
    this.crisisHandler = config.crisisHandler;
    
    this.currentStep = 'intro'; // 'intro', 'test', 'result'
    this.currentQuestion = 0;
    this.answers = new Array(this.questions.length).fill(null);
    this.scoreData = null;

    this.initDOM();
    this.attachEvents();
  }

  // ─── DOM INITIALIZATION ───────────────────────────────────────────────────
  initDOM() {
    this.els = {
      introStep: document.getElementById('stepIntro'),
      testStep: document.getElementById('stepTest'),
      resultStep: document.getElementById('stepResult'),
      
      startBtn: document.getElementById('startTestBtn'),
      agreement: document.getElementById('agreeCheckbox'),
      
      qContainer: document.getElementById('questionContainer'),
      progressBar: document.getElementById('progressBar'),
      qCountTxt: document.getElementById('qCountTxt'),
      progressPercent: document.getElementById('progressPercent'),
      encourageMsg: document.getElementById('encourageMsg'),
      
      prevBtn: document.getElementById('prevBtn'),
      nextBtn: document.getElementById('nextBtn'),
      
      leadForm: document.getElementById('leadForm'),
      submitBtn: document.getElementById('submitResultsBtn'),
      quickResult: document.getElementById('quickResultContent')
    };

    if (this.questions && this.els.qContainer) {
      this.renderQuestions();
    }
  }

  // ─── EVENT ENGINES ────────────────────────────────────────────────────────
  attachEvents() {
    // Intro
    if(this.els.startBtn) {
      this.els.startBtn.addEventListener('click', () => {
        if (!this.els.agreement.checked) {
          window.SC?.showToast('Vui lòng đồng ý với điều khoản để tiếp tục', 'warning');
          return;
        }
        this.goToStep('test');
      });
    }

    // Navigation
    if(this.els.prevBtn) {
      this.els.prevBtn.addEventListener('click', () => this.navigateQuestion(-1));
    }
    if(this.els.nextBtn) {
      this.els.nextBtn.addEventListener('click', () => {
        if (this.answers[this.currentQuestion] === null) {
          window.SC?.showToast('Vui lòng chọn một đáp án', 'warning');
          return;
        }
        this.navigateQuestion(1);
      });
    }

    // Radio changes
    if(this.els.qContainer) {
      this.els.qContainer.addEventListener('change', (e) => {
        if(e.target.type === 'radio') {
          const qIndex = parseInt(e.target.dataset.q);
          const val = parseInt(e.target.value);
          this.answers[qIndex] = val;
          
          this.updateProgress();
          
          // Auto advance after small delay
          setTimeout(() => {
            if (this.currentQuestion < this.questions.length - 1) {
              this.navigateQuestion(1);
            } else {
              this.finishTest();
            }
          }, 350);
        }
      });
    }

    // Form submit
    if(this.els.leadForm) {
      this.els.leadForm.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }

  // ─── RENDERING & NAVIGATION ───────────────────────────────────────────────
  goToStep(step) {
    this.currentStep = step;
    this.els.introStep.classList.remove('active');
    this.els.testStep.classList.remove('active');
    this.els.resultStep.classList.remove('active');
    
    if (step === 'intro') this.els.introStep.classList.add('active');
    if (step === 'test') {
      this.els.testStep.classList.add('active');
      this.showQuestion(0);
    }
    if (step === 'result') {
      this.els.resultStep.classList.add('active');
      this.scoreData = this.scoringHandler(this.answers);
      
      // Fire confetti
      if(typeof confetti === 'function') confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderQuestions() {
    this.els.qContainer.innerHTML = '';
    
    this.questions.forEach((q, i) => {
      const qCard = document.createElement('div');
      qCard.className = 'question-card';
      qCard.id = `qCard${i}`;
      qCard.style.display = 'none';
      
      let optionsHTML = '';
      this.options.forEach((opt, optIndex) => {
        optionsHTML += `
          <label class="option-label">
            <input type="radio" name="q${i}" value="${opt.value}" data-q="${i}">
            <div class="option-radio"></div>
            <span class="option-text" data-vi="${opt.vi}" data-en="${opt.en}">
               ${window.SC?.currentLang() === 'en' ? opt.en : opt.vi}
            </span>
          </label>
        `;
      });

      qCard.innerHTML = `
        <h3 class="q-text" data-vi="${q.vi}" data-en="${q.en}">
           ${i + 1}. ${window.SC?.currentLang() === 'en' ? q.en : q.vi}
        </h3>
        <div class="options-grid">${optionsHTML}</div>
      `;
      this.els.qContainer.appendChild(qCard);
    });
  }

  showQuestion(index) {
    // Hide old
    const oldCard = document.getElementById(`qCard${this.currentQuestion}`);
    if(oldCard) oldCard.style.display = 'none';
    
    // Show new
    this.currentQuestion = index;
    const newCard = document.getElementById(`qCard${this.currentQuestion}`);
    if(newCard) {
      newCard.style.display = 'block';
      newCard.style.animation = 'fadeInUp 0.4s ease forwards';
    }
    
    this.updateProgress();
    
    // Update buttons
    this.els.prevBtn.style.visibility = index === 0 ? 'hidden' : 'visible';
    
    const isLast = index === this.questions.length - 1;
    const nxtTxtVi = isLast ? 'Hoàn Thành' : 'Tiếp Theo';
    const nxtTxtEn = isLast ? 'Finish' : 'Next';
    
    this.els.nextBtn.innerHTML = `
      <span data-vi="${nxtTxtVi}" data-en="${nxtTxtEn}">${window.SC?.currentLang() === 'en' ? nxtTxtEn : nxtTxtVi}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px;margin-left:4px">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    `;
  }

  navigateQuestion(dir) {
    const newIndex = this.currentQuestion + dir;
    if(newIndex >= 0 && newIndex < this.questions.length) {
      this.showQuestion(newIndex);
    } else if (newIndex >= this.questions.length) {
      this.finishTest();
    }
  }

  updateProgress() {
    const total = this.questions.length;
    const answered = this.answers.filter(a => a !== null).length;
    const pct = Math.round((answered / total) * 100);
    
    this.els.qCountTxt.textContent = `Câu ${this.currentQuestion + 1}/${total}`;
    this.els.progressBar.style.width = `${pct}%`;
    this.els.progressPercent.textContent = `${pct}%`;
    
    // Encouragement
    const envgs = ['Bạn đang làm rất tốt 💙', 'Hãy cứ thong thả nhé 🌿', 'Một nửa chặng đường rồi ✨', 'Gần xong rồi! 🌟'];
    if(this.currentQuestion > 0 && this.currentQuestion % 3 === 0) {
      this.els.encourageMsg.textContent = envgs[Math.floor(this.currentQuestion/3) % envgs.length];
      this.els.encourageMsg.style.opacity = '1';
      setTimeout(() => this.els.encourageMsg.style.opacity = '0', 3000);
    }
  }

  finishTest() {
    // Check Crisis (e.g., PHQ-9 Q9)
    if(this.crisisHandler && this.crisisHandler(this.answers)) {
      this.showCrisisModal();
      return;
    }
    this.goToStep('result');
  }

  // ─── CRISIS HANDLER ───────────────────────────────────────────────────────
  showCrisisModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.innerHTML = `
      <div class="modal" style="border-top: 6px solid var(--crisis); text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🆘</div>
        <h2 style="color: var(--text-primary); margin-bottom: 1rem;" data-vi="Bạn Không Cô Đơn" data-en="You Are Not Alone">Bạn Không Cô Đơn</h2>
        <p style="color: var(--text-secondary); margin-bottom: 2rem; line-height: 1.6;" data-vi="Câu trả lời của bạn cho thấy bạn đang trải qua nỗi đau lớn. An toàn của bạn là điều quan trọng nhất. Vui lòng liên hệ với đường dây hỗ trợ ngay bây giờ." data-en="Your answers indicate you are experiencing immense pain. Your safety is the priority. Please reach out to a support line right now.">
          Câu trả lời của bạn cho thấy bạn đang trải qua nỗi đau lớn. An toàn của bạn là điều quan trọng nhất. Vui lòng liên hệ với đường dây hỗ trợ ngay bây giờ.
        </p>
        <a href="tel:0896397968" class="btn-primary" style="background: var(--crisis); box-shadow: 0 4px 20px rgba(239,68,68,0.3); width: 100%; justify-content: center; margin-bottom: 1rem; font-size: 1.2rem; padding: 1rem;">
          📞 089 639 7968
        </a>
        <button id="crisisCloseBtn" class="btn-secondary" style="width:100%; justify-content:center;">Tôi ổn, bỏ qua</button>
      </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('crisisCloseBtn').addEventListener('click', () => {
      modal.remove();
      this.goToStep('result'); // let them cont. to see results
    });
  }

  // ─── SUBMISSION ───────────────────────────────────────────────────────────
  async handleSubmit(e) {
    e.preventDefault();
    this.els.submitBtn.classList.add('loading');
    
    const formData = new FormData(this.els.leadForm);
    const data = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      answers: this.answers,
      scores: this.scoreData,
      lang: window.SC?.currentLang() || 'vi'
    };

    try {
      // API call (Assumes api.js is loaded)
      if(typeof API !== 'undefined') {
        const res = await API.submitTest(this.testId, data);
        window.SC?.showToast('Gửi kết quả thành công!', 'success');
        this.showQuickResults();
      } else {
        // Dev fallback
        setTimeout(() => {
          this.els.submitBtn.classList.remove('loading');
          window.SC?.showToast('(Mô phỏng) Gửi kết quả thành công!', 'success');
          this.showQuickResults();
        }, 1500);
      }
      
    } catch(err) {
      this.els.submitBtn.classList.remove('loading');
      window.SC?.showToast('Có lỗi xảy ra, vui lòng thử lại sau', 'error');
      console.error(err);
    }
  }

  showQuickResults() {
    this.els.submitBtn.classList.remove('loading');
    this.els.leadForm.style.display = 'none'; // Hide form
    
    const isCrisisValue = (this.scoreData.cssClass === 'moderate' || this.scoreData.cssClass === 'severe');
    const lang = window.SC?.currentLang() || 'vi';

    let supportBlock = '';
    if(isCrisisValue) {
      supportBlock = `
        <div class="support-prompt" style="margin-top: 2rem; border-top: 1px dashed var(--border); padding-top: 2rem;">
          <div style="background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.1); border-radius: 16px; padding: 20px; text-align: center;">
            <p style="font-size: 1rem; color: #334155; line-height: 1.6; margin-bottom: 1.5rem;" data-vi="Chúng mình hiểu rằng bạn đang phải đối mặt với một khoảng thời gian không hề dễ dàng. Bạn không cần phải bước đi một mình, các chuyên gia của SUNNYCARE luôn sẵn sàng lắng nghe và đồng hành cùng bạn." data-en="We understand you are facing a difficult time. You don't have to walk alone; SUNNYCARE experts are always ready to listen and support you.">
              ${lang === 'vi' ? 'Chúng mình hiểu rằng bạn đang phải đối mặt với một khoảng thời gian không hề dễ dàng. Bạn không cần phải bước đi một mình, các chuyên gia của SUNNYCARE luôn sẵn sàng lắng nghe và đồng hành cùng bạn.' : 'We understand you are facing a difficult time. You don\'t have to walk alone; SUNNYCARE experts are always ready to listen and support you.'}
            </p>
            <div style="display: flex; gap: 0.8rem; flex-wrap: wrap; justify-content: center;">
              <a href="tel:0896397968" class="btn-primary" style="background: #ef4444; width: 100%; max-width: 200px; justify-content: center;">
                📞 089 639 7968
              </a>
              <a href="https://www.sunnycare.vn/dat-lich-hen" target="_blank" class="btn-primary" style="background: #ff9500; width: 100%; max-width: 250px; justify-content: center;">
                 📅 ${lang === 'vi' ? 'Đặt Lịch Chuyên Gia' : 'Book a Consultation'}
              </a>
            </div>
          </div>
        </div>
      `;
    }

    this.els.quickResult.innerHTML = `
      <div class="quick-result show severity-${this.scoreData.cssClass}">
        <h3 style="margin-bottom: 1rem; color:var(--text-primary)">Kết quả sơ bộ của bạn:</h3>
        <div class="score-box">
          <span class="score-value">${this.scoreData.total}</span>
          <span class="score-label">Điểm</span>
        </div>
        <div class="severity-text">${lang === 'en' ? this.scoreData.severity_en : this.scoreData.severity_vi}</div>
        <p class="result-explanation">${lang === 'en' ? this.scoreData.desc_en : this.scoreData.desc_vi}</p>
        <p style="font-size: 0.9rem; color:var(--text-muted)">*Kết quả chi tiết cùng các lời khuyên chuyên môn đã được gửi vào email của bạn.</p>
        
        ${supportBlock}

        <div style="margin-top:2rem; display:flex; gap:1rem; justify-content:center; border-top: 1px solid var(--border); padding-top: 1.5rem;">
          <a href="../index.html" class="btn-secondary">Về Trang Chủ</a>
          <a href="../tools/breathing.html" class="btn-primary">Công Cụ Thư Giãn</a>
        </div>
      </div>
    `;
    // Retrigger language translations if exist
    if(window.SC && typeof setLanguage === 'function') setLanguage(lang);
  }
}

// Export
if (typeof module !== 'undefined') module.exports = TestEngine;
