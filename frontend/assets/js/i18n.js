/**
 * NIYD Hostel Management System - Internationalization (i18n)
 * Supports English and Bengali (বাংলা)
 */

const I18N = {
  currentLang: localStorage.getItem('niyd_language_pref') || 'en',

  translations: {
    en: {
      // Top bar & Organization
      orgName: 'National Institute of Youth Development',
      orgSub: 'Ministry of Youth and Sports, Govt. of Bangladesh',
      emergencyHelp: 'Emergency Hotline: 01700-000000',

      // Navigation
      navHome: 'Home',
      navFacilities: 'Facilities',
      navAnnouncements: 'Announcements',
      navRules: 'Rules & Guidelines',
      navContact: 'Contact',
      navStudentPortal: 'Student Portal',
      navAdminLogin: 'Admin Login',
      navStaffPortal: 'Staff Portal',
      navLogin: 'Sign In',
      navLogout: 'Sign Out',

      // Hero Section
      heroTag: 'Official Residential Management System',
      heroHeadline: 'A Better Living Experience for a Better Future.',
      heroSubheadline: 'An organized, secure, and supportive residential environment for the next generation of leaders.',
      btnApplyAdmission: 'Apply for Admission',
      btnStudentLogin: 'Student Portal Login',
      btnAdminEntry: 'Warden & Staff Entry',

      // Quick Stats
      statCapacity: 'Total Capacity',
      statCapacityVal: '450+ Beds',
      statBuildings: 'Hostel Blocks',
      statBuildingsVal: '2 Modern Blocks',
      statSecurity: 'Security & Safety',
      statSecurityVal: '24/7 CCTV & Guards',
      statConnectivity: 'Campus Wi-Fi',
      statConnectivityVal: 'High-Speed Fiber',

      // Facilities Section
      facilitiesTag: 'Campus Living',
      facilitiesTitle: 'World-Class Hostel Amenities',
      facilitiesSub: 'Designed to cultivate personal development, focused study, and a vibrant community life.',

      facilitySecurityTitle: '24/7 Safety & Security',
      facilitySecurityDesc: 'Biometric and smart-card entry system, round-the-clock security personnel, and CCTV surveillance.',

      facilityWifiTitle: 'High-Speed Wi-Fi',
      facilityWifiDesc: 'Dedicated gigabit fiber connectivity throughout all residential wings, study halls, and dining facilities.',

      facilityStudyTitle: 'Dedicated Study Rooms',
      facilityStudyDesc: 'Sound-dampened quiet study lounges on every floor equipped with ergonomic furniture and power outlets.',

      facilityDiningTitle: 'Hygienic Dining Hall',
      facilityDiningDesc: 'Nutritious meal plans prepared in certified sanitary kitchen environments under regular student oversight.',

      facilityMedicalTitle: 'Medical & First Aid',
      facilityMedicalDesc: 'On-campus first-aid clinic with on-call physician and 24/7 transport support for urgent care.',

      facilityPowerTitle: 'Uninterrupted Power',
      facilityPowerDesc: 'Heavy-duty automatic diesel generators ensuring uninterrupted electricity and study comfort at all times.',

      // Announcements Section
      announcementsTag: 'Notice Board',
      announcementsTitle: 'Official Announcements',
      announcementsSub: 'Important updates, fee schedules, hostel schedules, and guidelines.',
      viewAllAnnouncements: 'View All Notices',

      // Admission Banner
      admissionBannerTitle: 'Hostel Admissions Open for 2026 Session',
      admissionBannerDesc: 'Eligible students of NIYD diploma and executive programs can apply online for hostel allocation.',
      btnApplyNow: 'Submit Application Online',

      // Contact Section
      contactTag: 'Get In Touch',
      contactTitle: 'Hostel Administration & Office',
      contactSub: 'Our administrative staff and resident wardens are here to assist with any residence-related inquiries.',
      wardenOfficeTitle: 'Chief Warden Office',
      wardenOfficeDesc: 'Block A, Ground Floor, NIYD Campus, Savar, Dhaka',
      wardenHoursTitle: 'Office Hours',
      wardenHoursDesc: 'Sunday – Thursday: 9:00 AM – 5:00 PM',
      wardenEmailTitle: 'Official Correspondence',
      wardenEmailDesc: 'warden@niyd.gov.bd / hostel@niyd.gov.bd',

      // Footer
      footerDesc: 'The premier national institute for leadership development, technical skills, and residential student empowerment in Bangladesh.',
      footerQuickLinks: 'Quick Links',
      footerPortals: 'System Portals',
      footerLegal: 'Legal & Privacy',
      footerCopyright: '© 2026 National Institute of Youth Development (NIYD). All rights reserved.',
      footerGovt: 'Government of the People\'s Republic of Bangladesh'
    },

    bn: {
      // Top bar & Organization
      orgName: 'জাতীয় যুব উন্নয়ন ইনস্টিটিউট',
      orgSub: 'যুব ও ক্রীড়া মন্ত্রণালয়, গণপ্রজাতন্ত্রী বাংলাদেশ সরকার',
      emergencyHelp: 'জরুরি হেল্পলাইন: ০১৭০০-০০০০০০',

      // Navigation
      navHome: 'হোম',
      navFacilities: 'সুবিধাসমূহ',
      navAnnouncements: 'নোটিশ বোর্ড',
      navRules: 'নিয়মাবলী',
      navContact: 'যোগাযোগ',
      navStudentPortal: 'শিক্ষার্থী পোর্টাল',
      navAdminLogin: 'অ্যাডমিন লগইন',
      navStaffPortal: 'স্টাফ পোর্টাল',
      navLogin: 'লগইন করুন',
      navLogout: 'লগআউট',

      // Hero Section
      heroTag: 'অফিসিয়াল আবাসিক ব্যবস্থাপনা সিস্টেম',
      heroHeadline: 'উন্নত ভবিষ্যতের জন্য একটি সুন্দর আবাসিক পরিবেশ।',
      heroSubheadline: 'ভবিষ্যতের যোগ্য ও দক্ষ নেতৃত্ব গড়ে তোলার জন্য একটি সুশৃঙ্খল, নিরাপদ ও সহায়ক আবাসিক ব্যবস্থা।',
      btnApplyAdmission: 'আবাসনের আবেদন করুন',
      btnStudentLogin: 'শিক্ষার্থী লগইন',
      btnAdminEntry: 'ওয়ার্ডেন ও স্টাফ লগইন',

      // Quick Stats
      statCapacity: 'মোট ধারণক্ষমতা',
      statCapacityVal: '৪৫০+ সিট',
      statBuildings: 'হোস্টেল ব্লক',
      statBuildingsVal: '২টি আধুনিক ভবন',
      statSecurity: 'নিরাপত্তা ব্যবস্থা',
      statSecurityVal: '২৪/৭ সিসিটিভি ও প্রহরী',
      statConnectivity: 'ক্যাম্পাস ওয়াই-ফাই',
      statConnectivityVal: 'উচ্চগতির ফাইবার নেটওয়ার্ক',

      // Facilities Section
      facilitiesTag: 'হোস্টেল সুবিধা',
      facilitiesTitle: 'আধুনিক সুযোগ-সুবিধাসম্পন্ন আবাসিক জীবন',
      facilitiesSub: 'শিক্ষার্থীদের আত্মউন্নয়ন, পড়াশোনা এবং একটি সুশৃঙ্খল কমিউনিটি গড়ার লক্ষ্যে পরিকল্পিত।',

      facilitySecurityTitle: '২৪/৭ সার্বক্ষণিক নিরাপত্তা',
      facilitySecurityDesc: 'স্মার্ট অ্যাক্সেস নিয়ন্ত্রণ, সার্বক্ষণিক নিরাপত্তাকর্মী এবং উচ্চ ক্ষমতাসম্পন্ন সিসিটিভি নজরদারি।',

      facilityWifiTitle: 'উচ্চগতির ইন্টারনেট',
      facilityWifiDesc: 'প্রতিটি রুম, রিডিং রুম এবং ডাইনিং হলের জন্য সার্বক্ষণিক নিরবচ্ছিন্ন উচ্চগতির ওয়াই-ফাই সুবিধা।',

      facilityStudyTitle: 'শান্ত রিডিং রুম',
      facilityStudyDesc: 'মনোযোগ দিয়ে পড়ার জন্য প্রতিটি ফ্লোরে মনোরম ও শব্দমুক্ত স্টাডি লাউঞ্জের ব্যবস্থা।',

      facilityDiningTitle: 'স্বাস্থ্যকর ডাইনিং হল',
      facilityDiningDesc: 'নিয়মিত তদারকিতে প্রস্তুতকৃত পুষ্টিকর এবং স্বাস্থ্যকর খাবারের সুব্যবস্থা।',

      facilityMedicalTitle: 'প্রাথমিক চিকিৎসা ও ফার্স্ট এইড',
      facilityMedicalDesc: 'ক্যাম্পাসে জরুরি প্রাথমিক চিকিৎসা এবং সার্বক্ষণিক জরুরি পরিবহন সেবা।',

      facilityPowerTitle: 'নিরবচ্ছিন্ন বিদ্যুৎ',
      facilityPowerDesc: 'ভারী অটোমেটিক ডিজেল জেনারেটরের মাধ্যমে সার্বক্ষণিক বিদ্যুৎ সরবরাহের নিশ্চয়তা।',

      // Announcements Section
      announcementsTag: 'বিজ্ঞপ্তি',
      announcementsTitle: 'জরুরি নোটিশ ও নোটিশ বোর্ড',
      announcementsSub: 'হোস্টেল সংক্রান্ত সর্বশেষ বিজ্ঞপ্তি, ফি জমাদান ও নীতিমালার হালনাগাদ তথ্য।',
      viewAllAnnouncements: 'সকল নোটিশ দেখুন',

      // Admission Banner
      admissionBannerTitle: '২০২৬ শিক্ষাবর্ষের হোস্টেল ভর্তি কার্যক্রম চলমান',
      admissionBannerDesc: 'এনআইওয়াইডি ডিপ্লোমা ও এক্সিকিউটিভ কোর্সের শিক্ষার্থীরা অনলাইনে হোস্টেল সিটের জন্য আবেদন করতে পারবেন।',
      btnApplyNow: 'অনলাইনে আবেদন করুন',

      // Contact Section
      contactTag: 'যোগাযোগ',
      contactTitle: 'হোস্টেল প্রশাসন ও ওয়ার্ডেন কার্যালয়',
      contactSub: 'আবাসন সংক্রান্ত যেকোনো তথ্য বা সহায়তার জন্য আমাদের সাথে যোগাযোগ করুন।',
      wardenOfficeTitle: 'চিফ ওয়ার্ডেন কার্যালয়',
      wardenOfficeDesc: 'ব্লক-এ, নিচতলা, এনআইওয়াইডি ক্যাম্পাস, সাভার, ঢাকা',
      wardenHoursTitle: 'অফিস সময়সূচি',
      wardenHoursDesc: 'রবিবার – বৃহস্পতিবার: সকাল ৯:০০ – বিকাল ৫:০০',
      wardenEmailTitle: 'অফিসিয়াল ইমেইল',
      wardenEmailDesc: 'warden@niyd.gov.bd / hostel@niyd.gov.bd',

      // Footer
      footerDesc: 'বাংলাদেশের যুবদের দক্ষতা, নেতৃত্ব ও আবাসিক সার্বিক কল্যাণে নিবেদিত শীর্ষস্থানীয় জাতীয় প্রতিষ্ঠান।',
      footerQuickLinks: 'প্রয়োজনীয় লিংক',
      footerPortals: 'পোর্টালসমূহ',
      footerLegal: 'আইনি শর্তাবলী',
      footerCopyright: '© ২০২৬ জাতীয় যুব উন্নয়ন ইনস্টিটিউট (এনআইওয়াইডি)। সর্বস্বত্ব সংরক্ষিত।',
      footerGovt: 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার'
    }
  },

  // Initialize and apply language
  init() {
    this.apply(this.currentLang);
    this.bindEvents();
  },

  // Set language and update UI
  setLanguage(lang) {
    if (!this.translations[lang]) return;
    this.currentLang = lang;
    localStorage.setItem('niyd_language_pref', lang);
    document.documentElement.lang = lang;
    document.body.setAttribute('lang', lang);
    this.apply(lang);
    this.updateToggleButtons(lang);
  },

  // Apply translations to all DOM elements with data-i18n attribute
  apply(lang) {
    const dict = this.translations[lang] || this.translations.en;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          if (el.hasAttribute('placeholder')) {
            el.placeholder = dict[key];
          }
        } else {
          el.textContent = dict[key];
        }
      }
    });

    // Handle HTML attributes like title or aria-label
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (dict[key]) {
        el.title = dict[key];
      }
    });
  },

  // Update visual state of toggle buttons
  updateToggleButtons(lang) {
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      const btnLang = btn.getAttribute('data-lang');
      if (btnLang === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  // Bind click listeners to any language buttons
  bindEvents() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.lang-btn');
      if (btn) {
        const lang = btn.getAttribute('data-lang');
        if (lang) {
          this.setLanguage(lang);
        }
      }
    });
  },

  // Translate a single key programmatically
  t(key) {
    const dict = this.translations[this.currentLang] || this.translations.en;
    return dict[key] || key;
  }
};

window.I18N = I18N;
document.addEventListener('DOMContentLoaded', () => I18N.init());
