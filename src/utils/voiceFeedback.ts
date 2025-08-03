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
  private feedbackCooldown: number = 8000; // Increased to 8 seconds to reduce spam
  private repCount: number = 0;
  private lastRepCount: number = 0;
  private consecutiveFormIssues: number = 0; // Track consecutive form issues
  private lastFormAccuracy: number = 100; // Track previous accuracy
  private sessionStartTime: number = Date.now();

  constructor(config: VoiceFeedbackConfig = {
    enabled: true,
    volume: 0.7, // Reduced volume
    rate: 0.85, // Slightly slower for clarity
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
      this.consecutiveFormIssues = 0; // Reset form issues on good rep
      console.log('Voice: Rep completion feedback');
    }
    // Check for significant state changes (only if not a rep completion)
    else if (stateMachineResult?.debugInfo?.stateChange && 
             !stateMachineResult.debugInfo.stateChange.includes('REP COMPLETE')) {
      feedbackMessage = this.getStateChangeFeedback(stateMachineResult);
      console.log('Voice: State change feedback');
    }
    // Check for persistent form issues (only if accuracy is very low and getting worse)
    else if (formAnalysis && formAnalysis.accuracy !== undefined && 
             formAnalysis.accuracy < 25 && 
             formAnalysis.accuracy < this.lastFormAccuracy &&
             this.consecutiveFormIssues >= 2) {
      feedbackMessage = this.getIntelligentFormCorrectionFeedback(formAnalysis);
      this.consecutiveFormIssues++;
      console.log('Voice: Intelligent form correction feedback');
    }
    // Provide encouragement for excellent form (only occasionally and with very high threshold)
    else if (formAnalysis && formAnalysis.accuracy !== undefined && 
             formAnalysis.accuracy > 95 && 
             Math.random() < 0.1) { // Only 10% chance to avoid spam
      feedbackMessage = this.getEncouragementFeedback(formAnalysis);
      console.log('Voice: Encouragement feedback');
    }

    // Update form tracking
    if (formAnalysis && formAnalysis.accuracy !== undefined) {
      if (formAnalysis.accuracy < 30) {
        this.consecutiveFormIssues++;
      } else {
        this.consecutiveFormIssues = Math.max(0, this.consecutiveFormIssues - 1);
      }
      this.lastFormAccuracy = formAnalysis.accuracy;
    }

    if (feedbackMessage) {
      console.log('🎤 Voice feedback triggered:', feedbackMessage);
      this.speak(feedbackMessage);
      this.lastFeedbackTime = currentTime;
    }
  }

  private getRepCompletionFeedback(repCount: number, stateMachineResult: any): string {
    const quality = stateMachineResult?.repQuality || 'good';
    const sessionProgress = repCount / 10; // Assuming 10 reps total
    
    switch (quality) {
      case 'excellent':
        if (repCount === 10) {
          return `Perfect! You've completed all 10 reps with excellent form. Great job!`;
        } else if (repCount >= 7) {
          return `Outstanding! Rep ${repCount} was perfect. You're almost done!`;
        } else {
          return `Excellent form on rep ${repCount}! Keep that precision going.`;
        }
      case 'good':
        if (repCount === 10) {
          return `Great work! All 10 reps completed. Your form improved throughout the session.`;
        } else if (repCount >= 7) {
          return `Good rep ${repCount}! You're in the final stretch.`;
        } else {
          return `Solid rep ${repCount}. Good form!`;
        }
      case 'poor':
        if (repCount === 10) {
          return `Rep ${repCount} completed. Focus on form for your next session.`;
        } else {
          return `Rep ${repCount} done. Try to move more smoothly on the next one.`;
        }
      default:
        return `Rep ${repCount} completed!`;
    }
  }

  private getStateChangeFeedback(stateMachineResult: any): string {
    const stateChange = stateMachineResult.debugInfo.stateChange;
    
    if (stateChange.includes('Start position reached')) {
      return 'Perfect starting position. Now raise your arms smoothly to shoulder level.';
    }
    else if (stateChange.includes('End position reached')) {
      return 'Great! Hold this position briefly, then lower with control.';
    }
    
    return '';
  }

  private getIntelligentFormCorrectionFeedback(formAnalysis: any): string {
    const accuracy = formAnalysis.accuracy;
    const phase = formAnalysis.phase || 'unknown';
    const feedback = formAnalysis.feedback || '';
    
    // Very specific, actionable feedback based on accuracy and phase
    if (accuracy < 15) {
      if (phase === 'rest') {
        return 'I can see you\'re ready to start. Stand with your arms relaxed at your sides, then raise them smoothly out to the sides.';
      } else if (phase === 'raising') {
        return 'Your arms are moving, but try to raise them more evenly. Keep both arms at the same height as you lift.';
      } else if (phase === 'raised') {
        return 'Your arms are up, but they\'re not quite at shoulder level. Raise them a bit higher - your wrists should be level with your shoulders.';
      } else {
        return 'Focus on the movement pattern. Start with arms down, raise to shoulder level, hold briefly, then lower smoothly.';
      }
    }
    else if (accuracy < 25) {
      if (phase === 'raising') {
        return 'Good movement, but try to keep your arms straight as you raise them. Don\'t bend your elbows.';
      } else if (phase === 'raised') {
        return 'Almost there! Your arms need to be a bit higher. Your wrists should be at shoulder level, not below.';
      } else {
        return 'The movement is there, but try to make it more controlled. Raise and lower your arms more smoothly.';
      }
    }
    
    // If we have specific feedback from form analysis, use it
    if (feedback && feedback !== 'Check your form alignment') {
      return feedback;
    }
    
    return 'Try to match the movement pattern more closely. Focus on raising your arms to shoulder level.';
  }

  private getEncouragementFeedback(formAnalysis: any): string {
    const accuracy = formAnalysis.accuracy;
    const repCount = this.lastRepCount;
    
    if (accuracy > 98) {
      return 'Perfect form! You\'re doing this exactly right.';
    }
    else if (accuracy > 95) {
      return 'Excellent form! Keep up this precision.';
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
    const sessionTime = Date.now() - this.sessionStartTime;
    
    let message = '';
    
    if (totalReps >= 10) {
      message = 'Congratulations! You\'ve completed all 10 reps. ';
      
      if (averageAccuracy > 90) {
        message += 'Your form was excellent throughout the session. ';
      } else if (averageAccuracy > 75) {
        message += 'You showed good form and consistency. ';
      } else {
        message += 'You completed the exercise with room for improvement. ';
      }
    } else {
      message = `You completed ${totalReps} reps. `;
      
      if (averageAccuracy > 80) {
        message += 'Your form was very good. ';
      } else if (averageAccuracy > 60) {
        message += 'You showed decent form. ';
      } else {
        message += 'Focus on form for better results. ';
      }
    }
    
    message += `Your total score is ${totalScore} points. `;
    
    const minutes = Math.floor(sessionDuration / 60000);
    const seconds = Math.floor((sessionDuration % 60000) / 1000);
    message += `Session time: ${minutes} minutes and ${seconds} seconds. `;
    
    if (totalReps >= 10) {
      message += 'Great job completing the full session!';
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
        instructions = `Welcome to ${exerciseName}! I'll be your guide through this exercise. 
          Stand with your arms relaxed at your sides. 
          When you're ready, raise both arms smoothly out to the sides, keeping them straight, until they reach shoulder level. 
          Hold briefly, then slowly lower them back to the starting position. 
          Complete 10 reps with good form. I'll give you feedback along the way. Let's begin!`;
        break;
      default:
        instructions = `Welcome to ${exerciseName}! Follow the on-screen guidance and complete 10 reps with good form. I'll provide feedback to help you improve. Let's begin!`;
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