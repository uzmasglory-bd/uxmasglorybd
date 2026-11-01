Uzma's Glory - Watch Shop (Node.js + SQLite)

চালানোর নিয়ম:
1. Node.js 22.5 বা তার বেশি লাগবে (nodejs.org)।
2. এই ফোল্ডারে টার্মিনাল খুলে লিখুন:   node server.js
3. ব্রাউজারে খুলুন: http://localhost:3000
4. অ্যাডমিন: http://localhost:3000/#admin

অ্যাডমিন পাসওয়ার্ড: শুরুতে uzma123। বদলাতে সার্ভার চালানোর আগে সেট করুন:
   ADMIN_PASSWORD=আপনারপাসওয়ার্ড node server.js

হোস্টিংয়ের সময়: Node.js 22.5+ সাপোর্ট করে এমন VPS বা হোস্টিংয়ে এই পুরো ফোল্ডার তুলে `node server.js` চালান।
ডেটা থাকে: data/shop.db (অর্ডার ও ক্যাটালগ) এবং public/uploads/ (ছবি)। এই দুটো নিয়মিত ব্যাকআপ রাখুন।
