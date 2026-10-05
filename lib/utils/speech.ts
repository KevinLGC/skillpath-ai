/**
 * Web Speech API client utility for low-literacy and vernacular read-aloud support.
 */

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private onStateChangeListeners: ((speaking: boolean) => void)[] = [];

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public subscribe(listener: (speaking: boolean) => void) {
    this.onStateChangeListeners.push(listener);
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter((l) => l !== listener);
    };
  }

  private notify(speaking: boolean) {
    this.isSpeaking = speaking;
    this.onStateChangeListeners.forEach((listener) => listener(speaking));
  }

  public speak(text: string, lang: "te" | "hi" | "en" = "en", onEnd?: () => void) {
    if (!this.synth) {
      console.warn("SpeechSynthesis is not supported in this browser.");
      if (onEnd) onEnd();
      return;
    }

    // Cancel any ongoing speech
    this.synth.cancel();

    // Clean text and expand acronyms for natural vernacular pronunciation
    const cleanText = text
      .replace(/[*#_~`]/g, "")
      .replace(/₹\s*([0-9,]+)/g, "$1 రూపాయలు ")
      .replace(/₹/g, " రూపాయలు ")
      .replace(/NCVT/gi, " ఎన్ సి వి టి ")
      .replace(/NSQF/gi, " ఎన్ ఎస్ క్యూ ఎఫ్ ")
      .replace(/PMKK/gi, " పి ఎం కె కె ")
      .replace(/ITI/gi, " ఐ టి ఐ ")
      .replace(/EPF/gi, " ఈ పి ఎఫ్ ")
      .replace(/ESI/gi, " ఈ ఎస్ ఐ ")
      .replace(/NEP\s*2020/gi, " ఎన్ ఈ పి 2020 ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance = utterance;

    // Select suitable voice if available
    const voices = this.synth.getVoices();
    const langCode = lang === "te" ? "te-IN" : lang === "hi" ? "hi-IN" : "en-IN";
    const voice = voices.find(
      (v) => v.lang.toLowerCase().startsWith(langCode.toLowerCase()) || v.lang.startsWith(lang),
    );
    if (voice) {
      utterance.voice = voice;
    }

    utterance.lang = langCode;
    utterance.rate = 0.95; // Slightly slower for clarity with older parents
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.notify(true);
    };

    utterance.onend = () => {
      this.notify(false);
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn("Speech error:", e);
      this.notify(false);
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.notify(false);
    }
  }

  public getSpeakingState(): boolean {
    return this.isSpeaking;
  }
}

export const speechService = new SpeechService();
