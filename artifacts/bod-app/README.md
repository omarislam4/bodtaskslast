# Birth Of Dream (BOD) — Workspace Management

تطبيق ويب لإدارة المشاريع والمهام، مبني بـ React + Vite + Firebase.

---

## 🚀 تشغيل المشروع لوكال (Local Development)

```bash
# 1. ادخل على فولدر المشروع
cd artifacts/bod-app

# 2. ثبّت الـ packages
npm install

# 3. شغّل السيرفر
npm run dev
```

ثم افتح المتصفح على: **http://localhost:5173**

---

## 📁 هيكل الملفات (Folder Structure)

```
artifacts/bod-app/
├── index.html              ← نقطة الدخول (HTML الرئيسية)
├── vite.config.ts          ← إعدادات Vite (بورت، base path، aliases)
├── tsconfig.json           ← إعدادات TypeScript
├── package.json            ← الـ dependencies وسكريبتات التشغيل
└── src/
    ├── main.tsx            ← نقطة بداية React (يحمّل App)
    ├── App.tsx             ← الـ Router والـ providers الرئيسية
    ├── firebase.ts         ← إعداد Firebase (Auth + Firestore)
    ├── index.css           ← CSS عام + Tailwind
    │
    ├── pages/              ← كل صفحة ليها ملف هنا
    │   ├── Login.tsx       ← صفحة تسجيل الدخول
    │   ├── Signup.tsx      ← صفحة إنشاء حساب
    │   ├── Dashboard.tsx   ← الداشبورد (admin فقط)
    │   ├── Spaces.tsx      ← قائمة الـ spaces
    │   ├── SpaceDetail.tsx ← تفاصيل space واحد (مع tasks)
    │   ├── TaskDetail.tsx  ← تفاصيل task (مع activity log)
    │   ├── Timeline.tsx    ← عرض الجدول الزمني
    │   ├── Members.tsx     ← إدارة الأعضاء
    │   ├── Senders.tsx     ← إدارة المرسلين
    │   ├── History.tsx     ← سجل المهام المنتهية
    │   └── Settings.tsx    ← إعدادات الحساب والـ webhook
    │
    ├── components/
    │   ├── layout/
    │   │   ├── AppLayout.tsx   ← الـ layout الرئيسي (sidebar + topbar)
    │   │   ├── Sidebar.tsx     ← القائمة الجانبية
    │   │   └── Topbar.tsx      ← الشريط العلوي (بحث + notifications)
    │   ├── tasks/
    │   │   ├── TaskCard.tsx         ← كارت المهمة في القوائم
    │   │   ├── TaskStatusBadge.tsx  ← badge الحالة (todo, done...)
    │   │   └── TaskPriorityBadge.tsx← badge الأولوية (low, urgent...)
    │   ├── shared/
    │   │   ├── AvatarGroup.tsx  ← مجموعة avatars للأعضاء
    │   │   ├── ProgressBar.tsx  ← شريط التقدم
    │   │   ├── EmptyState.tsx   ← رسالة لما مفيش داتا
    │   │   └── SkeletonLoader.tsx← loading placeholders
    │   └── ui/              ← مكونات Radix UI الجاهزة (لا تعدّل فيها)
    │
    ├── hooks/              ← Custom React hooks للداتا
    │   ├── useTasks.ts         ← جلب المهام من Firestore
    │   ├── useSpaces.ts        ← جلب الـ spaces
    │   ├── useMembers.ts       ← جلب الأعضاء
    │   ├── useSenders.ts       ← جلب المرسلين
    │   ├── useSpaceData.ts     ← جلب ملفات/روابط الـ space
    │   ├── useWebhook.ts       ← إعدادات الـ webhook + sendToWebhook
    │   └── useShiftReminder.ts ← تذكير نهاية الشيفت تلقائي
    │
    ├── contexts/           ← React Context للداتا المشتركة
    │   ├── AuthContext.tsx     ← بيانات المستخدم المسجل
    │   └── ThemeContext.tsx    ← الوضع الداكن/الفاتح
    │
    └── lib/
        └── utils.ts        ← دالة cn() لدمج CSS classes
```

---

## 🗃️ قاعدة البيانات (Firestore Collections)

| Collection | المحتوى |
|-----------|--------|
| `users` | بيانات المستخدمين (email, role, phone...) |
| `members` | نسخة مزامنة من users للـ n8n workflows |
| `spaces` | مساحات العمل |
| `tasks` | المهام (كل task جوّاه `activityLog` array) |
| `senders` | المرسلين (عملاء/جهات خارجية) |
| `settings/global` | إعدادات الـ webhook |

### هيكل الـ activityLog في كل task:
```
task.activityLog = [
  {
    type: "reply" | "notification" | "message" | "comment",
    source: "whatsapp" | "manual" | "system",
    text: "نص الرسالة",
    timestamp: 1234567890,   // unix ms
    sender: "اسم المرسل"
  }
]
```
> ✅ نفس الهيكل اللي الـ n8n WhatsApp Flow بيكتب فيه

---

## ✏️ إزاي تعدل في الكود

### عاوز تغير شكل صفحة معينة؟
افتح `src/pages/` وعدّل الملف المناسب.

### عاوز تغير الـ sidebar أو الـ navbar؟
- `src/components/layout/Sidebar.tsx` — القائمة الجانبية
- `src/components/layout/Topbar.tsx` — الشريط العلوي

### عاوز تضيف field جديد للـ task؟
1. أضفه في `src/hooks/useTasks.ts` (interface Task)
2. اعرضه في `src/pages/TaskDetail.tsx`
3. احفظه في Firestore بـ `updateDoc`

### عاوز تضيف صفحة جديدة؟
1. أنشئ ملف في `src/pages/MyPage.tsx`
2. أضف route في `src/App.tsx`
3. أضف link في `src/components/layout/Sidebar.tsx`

---

## 🔐 الـ Authentication

- المنصة: **Firebase Auth** (email/password)
- الـ admin email: `admin.bod@gmail.com` (أو أي user بـ role = "admin")
- الـ admin بيشوف كل الصفحات، الـ member بيشوف Spaces + Settings بس

---

## 🔔 الـ Webhook (WhatsApp n8n)

1. **إرسال تذكير يدوي**: من صفحة TaskDetail → زرار "Send Reminder"
2. **تذكير تلقائي نهاية الشيفت**: كل دقيقة الـ app بيتحقق لو في members وصلوا لنهاية الشيفت
3. الردود من WhatsApp بتتحفظ في `task.activityLog` عن طريق الـ n8n workflow

---

## 🌐 Deploy على Netlify

```bash
npm run build
# ارفع فولدر dist/ على Netlify
```

أو اربط الـ repo على Netlify وحط build command: `npm run build` وpublish dir: `dist`

---

## 🛠️ تشغيل على Replit

الـ app بيقرأ `PORT` و `BASE_PATH` من environment variables تلقائياً.
لو مش موجودين بيستخدم defaults: port 5173 وbase "/".
