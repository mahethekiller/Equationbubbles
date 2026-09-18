import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  MaxAdContentRating
} from '@capacitor-community/admob';

/**
 * AdService - Google AdMob Monetization Manager
 * Fully COPPA & Google Play "Designed for Families" compliant.
 * All requests enforce G rating and child-directed treatment.
 * Provides web dev fallbacks so local browser testing runs seamlessly.
 */
class AdService {
  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.isInitialized = false;
    this.isBannerShowing = false;

    // Minimum interval between interstitials (90 seconds)
    this.minInterstitialIntervalMs = 90000;
    this.lastInterstitialTime = 0;
    this.levelsCompletedSinceLastAd = 0;
    this.interstitialLevelThreshold = 3; // Show every 3 completed levels

    // Official Google AdMob Test Ad Unit IDs for Android
    this.adUnits = {
      banner: 'ca-app-pub-3940256099942544/6300978111',
      interstitial: 'ca-app-pub-3940256099942544/1033173712',
      rewarded: 'ca-app-pub-3940256099942544/5224354917'
    };
  }

  /**
   * Initialize AdMob with Child-Directed / Designed for Families settings
   */
  async init() {
    if (this.isInitialized) return;

    if (!this.isNative) {
      console.log('[AdService] Running in Web environment — mock ad mode enabled.');
      this.isInitialized = true;
      return;
    }

    try {
      await AdMob.initialize({
        requestTrackingAuthorization: false,
        testingDevices: ['EMULATOR'],
        initializeForTesting: true
      });

      console.log('[AdService] AdMob Native SDK Initialized successfully.');
      this.isInitialized = true;
    } catch (err) {
      console.warn('[AdService] AdMob init error:', err);
    }
  }

  /**
   * Show bottom banner ad on non-gameplay screens (Main Menu, Level Select)
   */
  async showBanner() {
    if (this.isBannerShowing) return;

    if (!this.isNative) {
      this.isBannerShowing = true;
      console.log('[AdService] [Web Mock] Banner Ad shown at bottom.');
      return;
    }

    try {
      await this.init();
      await AdMob.showBanner({
        adId: this.adUnits.banner,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: true,
        // COPPA & Family Policy Compliance
        npa: true,
        tagForChildDirectedTreatment: true,
        tagForUnderAgeOfConsent: true,
        maxAdContentRating: MaxAdContentRating.G
      });
      this.isBannerShowing = true;
    } catch (err) {
      console.warn('[AdService] Failed to show banner:', err);
    }
  }

  /**
   * Hide banner ad during active gameplay to avoid obscuring floating bubbles
   */
  async hideBanner() {
    if (!this.isBannerShowing) return;

    if (!this.isNative) {
      this.isBannerShowing = false;
      console.log('[AdService] [Web Mock] Banner Ad hidden.');
      return;
    }

    try {
      await AdMob.hideBanner();
      this.isBannerShowing = false;
    } catch (err) {
      console.warn('[AdService] Failed to hide banner:', err);
    }
  }

  /**
   * Show interstitial ad after level completion
   * Enforces minimum 90-second cooldown and 3-level completion requirement.
   */
  async showInterstitial(force = false) {
    this.levelsCompletedSinceLastAd++;
    const now = Date.now();
    const timeElapsed = now - this.lastInterstitialTime;

    const cooldownPassed = timeElapsed >= this.minInterstitialIntervalMs;
    const levelThresholdReached = this.levelsCompletedSinceLastAd >= this.interstitialLevelThreshold;

    if (!force && (!cooldownPassed || !levelThresholdReached)) {
      console.log(
        `[AdService] Interstitial skipped. Cooldown: ${Math.round(timeElapsed / 1000)}s/90s, Levels: ${this.levelsCompletedSinceLastAd}/${this.interstitialLevelThreshold}`
      );
      return false;
    }

    if (!this.isNative) {
      console.log('[AdService] [Web Mock] Interstitial displayed & closed.');
      this.lastInterstitialTime = now;
      this.levelsCompletedSinceLastAd = 0;
      return true;
    }

    try {
      await this.init();

      // Prepare interstitial
      await AdMob.prepareInterstitial({
        adId: this.adUnits.interstitial,
        isTesting: true,
        npa: true,
        tagForChildDirectedTreatment: true,
        tagForUnderAgeOfConsent: true,
        maxAdContentRating: MaxAdContentRating.G
      });

      // Display interstitial
      await AdMob.showInterstitial();

      this.lastInterstitialTime = Date.now();
      this.levelsCompletedSinceLastAd = 0;
      return true;
    } catch (err) {
      console.warn('[AdService] Failed to show interstitial:', err);
      return false;
    }
  }

  /**
   * Show rewarded video ad for player revives (watch ad to get 3 hearts on Game Over)
   * @param {Function} onRewardEarned Callback invoked when reward is granted
   * @param {Function} onDismissed Callback invoked when ad closes
   */
  async showRewarded(onRewardEarned, onDismissed) {
    if (!this.isNative) {
      console.log('[AdService] [Web Mock] Rewarded video simulated. Reward granted!');
      if (onRewardEarned) onRewardEarned({ type: 'hearts', amount: 3 });
      if (onDismissed) onDismissed();
      return;
    }

    try {
      await this.init();

      let rewardGiven = false;

      // Listen for reward item
      const rewardListener = await AdMob.addListener('onRewarded', (reward) => {
        rewardGiven = true;
        if (onRewardEarned) onRewardEarned(reward || { type: 'hearts', amount: 3 });
      });

      const dismissListener = await AdMob.addListener('onDismissed', () => {
        rewardListener.remove();
        dismissListener.remove();
        if (onDismissed) onDismissed();
      });

      await AdMob.prepareRewardVideoAd({
        adId: this.adUnits.rewarded,
        isTesting: true,
        npa: true,
        tagForChildDirectedTreatment: true,
        tagForUnderAgeOfConsent: true,
        maxAdContentRating: MaxAdContentRating.G
      });

      await AdMob.showRewardVideoAd();
    } catch (err) {
      console.warn('[AdService] Failed to show rewarded video:', err);
      // Fallback in case of ad load failure so player isn't stuck
      if (onDismissed) onDismissed();
    }
  }
}

export const adService = new AdService();
