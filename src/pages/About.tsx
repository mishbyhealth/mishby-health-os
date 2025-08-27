import React from "react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">About GloWell</h2>
        <Link
          to="/health-plan"
          className="px-4 py-2 rounded-xl bg-slate-800 text-white shadow hover:opacity-90"
        >
          Build Your Plan
        </Link>
      </header>

      <div className="grid gap-4">
        <Card title="Our Mission">
          <p className="text-slate-700">
            GloWell का उद्देश्य लोगों की <strong>मानसिक एवं शारीरिक सेहत</strong> को
            सरल, सुरक्षित और टिकाऊ आदतों के ज़रिये बेहतर बनाना है — शोर से दूर,
            प्रकृति के करीब। हम चाहते हैं कि हर व्यक्ति शांति, करुणा और स्पष्टता के साथ
            जी सके।
          </p>
        </Card>

        <Card title="What You’ll Find">
          <ul className="list-disc ml-5 text-slate-700 space-y-1">
            <li>Evidence-informed दैनिक रूटीन (पानी, भोजन, मूवमेंट, नींद)</li>
            <li>सीधी भाषा, छोटे-छोटे actionable स्टेप्स</li>
            <li>सुंदर PDF export, शेयर-friendly प्लान</li>
            <li>प्राइवेसी-first डिज़ाइन (आपका डेटा आपका है)</li>
          </ul>
        </Card>

        <Card title="Our Promise">
          <p className="text-slate-700">
            GloWell चिकित्सा सलाह का विकल्प नहीं है, पर आपको रोज़मर्रा की
            स्वस्थ आदतें बनाने में <em>मदद</em> करता है। हम सुरक्षित, सम्मानजनक और
            विज्ञापन-मुक्त अनुभव देने के लिए प्रतिबद्ध हैं।
          </p>
        </Card>

        <Card title="Contact">
          <p className="text-slate-700">
            सुझाव/प्रश्न: <a className="underline" href="mailto:hello@mishbyhealth.com">hello@mishbyhealth.com</a>
          </p>
        </Card>
      </div>
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-2xl shadow bg-white/90 border border-black/5">
      <h3 className="font-medium mb-2">{title}</h3>
      {children}
    </div>
  );
}
