/*
  مكتبة بكالوريا كود - روابط مجلدات Google Drive
  ------------------------------------------------
  لإضافة مجلد جديد: انسخ أي كتلة { ... } وحط بعدها فاصلة (,) وعدّل البيانات.
  ⚠️ أهم قاعدة: لازم فاصلة (,) بعد كل كتلة ما عدا الأخيرة.

  grade : first (أولى ثانوي)  |  second (تانية ثانوي)
  type  : questionBank (بنك الأسئلة) | exam (امتحانات) | recitation (تسميعات)
          quizzes (حل الكويزات) | assessments (حل التقييمات)
          answers (إجابات) | revision (مراجعات) | other (أخرى)
  id    : رقم فريد لكل ملف (مهم عشان المفضلة)، ما تكررش رقم.

  صلاحية كل مجلد على Drive لازم تكون: "أي شخص لديه الرابط - مشاهد".
*/
window.BACCALAUREATE_FILES = [
  /* ============ أولى ثانوي ============ */
  {
    id: 1,
    grade: "first",
    title: "بنك الأسئلة - أولى ثانوي",
    unit: "بنك الأسئلة",
    type: "questionBank",
    url: "https://drive.google.com/drive/folders/1oQD1ETGZoGU8KYaRmufet2ndkWlun3E-?usp=drive_link"
  },
  {
    id: 2,
    grade: "first",
    title: "امتحانات أولى ثانوي",
    unit: "الامتحانات",
    type: "exam",
    url: "https://drive.google.com/drive/folders/1TJn48KasBvSYu2K6DgEI1Hfqz3Ai6a3M?usp=drive_link"
  },
  {
    id: 3,
    grade: "first",
    title: "تسميعات أولى ثانوي",
    unit: "التسميعات",
    type: "recitation",
    url: "https://drive.google.com/drive/folders/19IPd3RdY3TECXcC-RpS4Xg_IvYQjfmN5?usp=drive_link"
  },

  /* ============ تانية ثانوي ============ */
  {
    id: 4,
    grade: "second",
    title: "حل الكويزات - تانية ثانوي",
    unit: "حل الكويزات",
    type: "quizzes",
    // ⚠️ الرابط ده نفس رابط "تسميعات أولى ثانوي" - راجعه وحط رابط فولدر الكويزات الصح
    url: "https://drive.google.com/drive/folders/19IPd3RdY3TECXcC-RpS4Xg_IvYQjfmN5?usp=drive_link"
  },
  {
    id: 5,
    grade: "second",
    title: "حل التقييمات - تانية ثانوي",
    unit: "حل التقييمات",
    type: "assessments",
    url: "https://drive.google.com/drive/folders/13zP8-JfW3Y811uvgTaHO3DoHZ86sUhtN?usp=drive_link"
  },
  {
    id: 6,
    grade: "second",
    title: "حل بنك الأسئلة - تانية ثانوي",
    unit: "حل بنك الأسئلة",
    type: "questionBank",
    url: "https://drive.google.com/drive/folders/1NSzm7eo79a7xiNCQeabAViGGIJ3Xo2rM?usp=drive_link"
  },
  {
    id: 7,
    grade: "second",
    title: "حل الامتحانات - تانية ثانوي",
    unit: "حل الامتحانات",
    type: "exam",
    // ⚠️ الرابط ده نفس رابط "حل بنك الأسئلة" - راجعه وحط رابط فولدر الامتحانات الصح
    url: "https://drive.google.com/drive/folders/1NSzm7eo79a7xiNCQeabAViGGIJ3Xo2rM?usp=drive_link"
  }
];
