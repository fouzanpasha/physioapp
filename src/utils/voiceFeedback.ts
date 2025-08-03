export interface VoiceFeedbackConfig {
  enabled: boolean;
  volume: number;
  rate: number;
  pitch: number;
  voiceType: 'male' | 'female' | 'neutral';
}

export class VoiceFeedbackSystem {
  private speechSynthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private config: VoiceFeedbackConfig;
  private lastFeedbackTime: number = 0;
  private feedbackCooldown: number = 3000; // 3 seconds between feedback
  private repCount: number = 0;
  private lastRepCount: number = 0;

  constructor(config: VoiceFeedbackConfig = {
    enabled: true,
    volume: 0.8,
    rate: 0.9,
    pitch: 1.0,
    voiceType: 'neutral'
  }) {
    this.speechSynthesis = window.speechSynthesis;
    this.config = config;
    this.initializeVoice();
  }

  private initializeVoice() {
    // Wait for voices to load
    if (this.speechSynthesis.getVoices().length === 0) {
      this.speechSynthesis.addEventListener('voiceschanged', () => {
        this.setupVoice();
      });
    } else {
      this.setupVoice();
    }
  }

  private setupVoice() {
    const voices = this.speechSynthesis.getVoices();
    let selectedVoice = voices.find(voice => voice.lang === 'en-US');

    // Try to find a voice that matches the preferred type
    if (this.config.voiceType === 'male') {
      selectedVoice = voices.find(voice => 
        voice.lang === 'en-US' && voice.name.toLowerCase().includes('male')
      ) || selectedVoice;
    } else if (this.config.voiceType === 'female') {
      selectedVoice = voices.find(voice => 
        voice.lang === 'en-US' && voice.name.toLowerCase().includes('female')
      ) || selectedVoice;
    }

    if (selectedVoice) {
      console.log('Voice feedback initialized with:', selectedVoice.name);
    }
  }

  public updateConfig(newConfig: Partial<VoiceFeedbackConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public provideFeedback(
    stateMachineResult: any,
    formAnalysis: any,
    currentRep: number,
    score: number
  ) {
    if (!this.config.enabled) return;

    const currentTime = Date.now();
    if (currentTime - this.lastFeedbackTime < this.feedbackCooldown) {
      return; // Still in cooldown
    }

    let feedbackMessage = '';

    // Check for rep completion first (highest priority)
    if (currentRep > this.lastRepCount) {
      feedbackMessage = this.getRepCompletionFeedback(currentRep, stateMachineResult);
      this.lastRepCount = currentRep;
      console.log('Voice: Rep completion feedback');
    }
    // Check for state changes (only if not a rep completion)
    else if (stateMachineResult?.debugInfo?.stateChange && 
             !stateMachineResult.debugInfo.stateChange.includes('REP COMPLETE')) {
      feedbackMessage = this.getStateChangeFeedback(stateMachineResult);
      console.log('Voice: State change feedback');
    }
    // Check for form issues (only if accuracy is significantly low and we have form data)
    else if (formAnalysis && formAnalysis.accuracy !== undefined && formAnalysis.accuracy < 50) {
      feedbackMessage = this.getFormCorrectionFeedback(formAnalysis);
      console.log('Voice: Form correction feedback');
    }
    // Provide encouragement for good form (only occasionally)
    else if (formAnalysis && formAnalysis.accuracy !== undefined && formAnalysis.accuracy > 85 && 
             Math.random() < 0.3) { // 30% chance to avoid spam
      feedbackMessage = this.getEncouragementFeedback(formAnalysis);
      console.log('Voice: Encouragement feedback');
    }

    if (feedbackMessage) {
      console.log('🎤 Voice feedback triggered:', feedbackMessage);
      this.speak(feedbackMessage);
      this.lastFeedbackTime = currentTime;
    }
  }

  private getRepCompletionFeedback(repCount: number, stateMachineResult: any): string {
    const quality = stateMachineResult?.repQuality || 'good';
    
    switch (quality) {
      case 'excellent':
        return `Excellent! Rep ${repCount} completed with perfect form. Keep it up!`;
      case 'good':
        return `Great job! Rep ${repCount} completed. Good form!`;
      case 'poor':
        return `Rep ${repCount} completed, but focus on your form. Try to move more smoothly.`;
      default:
        return `Rep ${repCount} completed!`;
    }
  }

  private getStateChangeFeedback(stateMachineResult: any): string {
    const stateChange = stateMachineResult.debugInfo.stateChange;
    
    if (stateChange.includes('Start position reached')) {
      return 'Good starting position. Now raise your arms smoothly.';
    }
    else if (stateChange.includes('End position reached')) {
      return 'Great! Hold briefly, then lower back down.';
    }
    else if (stateChange.includes('REP COMPLETE')) {
      return 'Rep completed! Return to starting position for the next rep.';
    }
    
    return '';
  }

  private getFormCorrectionFeedback(formAnalysis: any): string {
    const accuracy = formAnalysis.accuracy;
    const feedback = formAnalysis.feedback || '';
    
    if (accuracy < 30) {
      return 'Your form needs work. Slow down and focus on the movement pattern.';
    }
    else if (accuracy < 50) {
      return 'Try to match the template movement more closely.';
    }
    
    return feedback;
  }

  private getEncouragementFeedback(formAnalysis: any): string {
    const accuracy = formAnalysis.accuracy;
    
    if (accuracy > 95) {
      return 'Outstanding form! You\'re doing this perfectly!';
    }
    else if (accuracy > 85) {
      return 'Excellent form! Keep moving smoothly.';
    }
    else if (accuracy > 75) {
      return 'Great form! You\'re on the right track.';
    }
    
    return '';
  }

  public provideSessionFeedback(sessionStats: {
    totalReps: number;
    averageAccuracy: number;
    totalScore: number;
    sessionDuration: number;
  }) {
    if (!this.config.enabled) return;

    const { totalReps, averageAccuracy, totalScore, sessionDuration } = sessionStats;
    
    let message = `Session complete! You completed ${totalReps} reps `;
    
    if (averageAccuracy > 85) {
      message += 'with excellent form! ';
    } else if (averageAccuracy > 70) {
      message += 'with good form! ';
    } else {
      message += 'with room for improvement. ';
    }
    
    message += `Your total score is ${totalScore} points. `;
    
    const minutes = Math.floor(sessionDuration / 60000);
    const seconds = Math.floor((sessionDuration % 60000) / 1000);
    message += `Session duration: ${minutes} minutes and ${seconds} seconds. `;
    
    if (totalReps >= 10) {
      message += 'Congratulations on completing all 10 reps!';
    } else {
      message += 'Keep practicing to improve your form and complete more reps.';
    }
    
    this.speak(message);
  }

  public provideExerciseInstructions(exerciseName: string) {
    if (!this.config.enabled) return;

    let instructions = '';
    
    switch (exerciseName.toLowerCase()) {
      case 'shoulder abduction':
      case 'sky painter':
        instructions = `Welcome to ${exerciseName}! Stand with your arms at your sides. 
          Raise your arms out to the sides, keeping them straight, until they reach shoulder level. 
          Hold briefly, then slowly lower them back to the starting position. 
          Complete 10 reps with good form. Let's begin!`;
        break;
      default:
        instructions = `Welcome to ${exerciseName}! Follow the on-screen guidance and complete 10 reps with good form. Let's begin!`;
    }
    
    this.speak(instructions);
  }

  public provideCountdown(count: number) {
    if (!this.config.enabled) return;
    
    if (count > 0) {
      this.speak(count.toString());
    } else {
      this.speak('Begin!');
    }
  }

  private speak(text: string) {
    // Stop any current speech
    if (this.currentUtterance) {
      this.speechSynthesis.cancel();
    }

    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.volume = this.config.volume;
    this.currentUtterance.rate = this.config.rate;
    this.currentUtterance.pitch = this.config.pitch;

    // Set voice
    const voices = this.speechSynthesis.getVoices();
    const selectedVoice = voices.find(voice => voice.lang === 'en-US');
    if (selectedVoice) {
      this.currentUtterance.voice = selectedVoice;
    }

    this.speechSynthesis.speak(this.currentUtterance);
    
    console.log('Voice feedback:', text);
  }

  public stop() {
    this.speechSynthesis.cancel();
    this.currentUtterance = null;
  }

  public pause() {
    this.speechSynthesis.pause();
  }

  public resume() {
    this.speechSynthesis.resume();
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  public toggle() {
    this.config.enabled = !this.config.enabled;
    if (!this.config.enabled) {
      this.stop();
    }
  }
} 