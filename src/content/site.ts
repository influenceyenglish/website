/** Single source for public offer content. Amounts are in INR paise. */
export const plans = {
  monthly: {
    id: "monthly",
    label: "Monthly",
    displayPrice: "₹499",
    monthlyEquivalent: "₹499",
    cadence: "month",
    period: "monthly",
    description: "A month of guided English-speaking practice",
  },
  yearly: {
    id: "yearly",
    label: "Yearly",
    displayPrice: "₹4,788",
    monthlyEquivalent: "₹399",
    cadence: "year",
    period: "yearly",
    description: "A year of guided practice at ₹399 per month, billed annually",
  },
} as const;
export type PlanKey = keyof typeof plans;

export const site = {
  name: "Influency English",
  joinHref: "#pricing",
  email: "hello@influenceyenglish.com",
  hero: {
    heading: "For people who are ready to speak English.",
    description:
      "Influency English is a speaking-practice community for anyone who wants to speak clearly, build confidence, and grow through real conversations.",
    note: "Real practice · No more fear of speaking",
  },
  navigation: [
    { label: "The method", href: "#inside" },
    { label: "Membership", href: "#benefits" },
    { label: "Pricing", href: "#pricing" },
  ],
  problem: {
    heading: "You know more English\nthan you feel ready to speak.",
    paragraphs: [
      "You can understand a video or follow a conversation. But when it is your turn in a meeting, interview or group discussion, the words do not come as easily. You overthink, translate in your head, or stay quiet.",
      "More passive learning is not always the missing piece. You need a place to speak, notice what can improve, and try again — without being judged for getting it wrong.",
    ],
    callout: "YOU DON’T HAVE TO PRACTICE ENGLISH ALONE ANYMORE.",
    features: [
      {
        title: "Topic Discussion",
        detail: "Share ideas. Find your voice.",
        src: "/images/features/topic-discussion.jpg",
        alt: "A group sharing ideas around a table with laptops",
      },
      {
        title: "Daily 1-on-1 Breakout Discussions",
        detail: "More conversation. Every day.",
        src: "/images/features/daily-breakout-discussion.jpg",
        alt: "An online discussion on a laptop screen",
      },
      {
        title: "Weekly Public Speaking",
        detail: "Step up. Speak with confidence.",
        src: "/images/features/public-speaking-session-weekly.webp",
        alt: "Influency English public-speaking session with members on a video call",
      },
      {
        title: "Shadow Writing",
        detail: "Notice the language. Make it yours.",
        src: "/images/features/shadow-writing.jpg",
        alt: "A learner practising writing with notes at a desk",
      },
      {
        title: "Daily Quiz",
        detail: "A little challenge. A daily habit.",
        src: "/images/features/daily-quiz.jpg",
        alt: "Learners working through an activity on a laptop",
      },
    ],
  },
  overview: {
    heading: "Speak. Get feedback.\nCorrect. Repeat.",
    description:
      "Our Corrective Feedback Loop (CFL) makes speaking the centre of learning. Like the natural cycle children use while acquiring their first language, you learn through use, helpful responses, correction and another attempt. This is our practice approach, not a promise of identical learning outcomes.",
    features: [
      {
        icon: "framework",
        title: "Speak before you feel ready.",
        description:
          "Use English in purposeful conversations, public-speaking practice and real situations. Make your current ability the starting point.",
      },
      {
        icon: "feedback",
        title: "Get specific, kind feedback.",
        description:
          "Notice what worked and what needs attention: clarity, language, listening, tone and the way you connect with others.",
      },
      {
        icon: "people",
        title: "Correct, then try again.",
        description:
          "Apply one useful correction, repeat the task and reflect. Small feedback loops help you build a more dependable speaking habit.",
      },
    ],
  },
  includes: [
    "Daily One-on-One Breakout Discussions",
    "Weekly public-speaking sessions",
    "Communication courses and resources",
    "Speaker-identity training",
    "Daily Quiz",
    "Shadow Writing",
    "Community support",
  ],
  benefits: [
    {
      title: "Find your speaking rhythm",
      description:
        "Regular public-speaking practice and weekly mastermind discussions turn learning into participation.",
    },
    {
      title: "Build your speaker identity",
      description:
        "Communication resources and identity training help you see yourself as someone who contributes, not someone who hides.",
    },
    {
      title: "Practise with people",
      description:
        "Live speaking opportunities, corrective feedback and community support make the next attempt easier to take.",
    },
  ],
  audience: [
    "You are a student, graduate or professional newly entering your career",
    "You understand some English but hesitate to speak in interviews, meetings or groups.",
    "You want to practise consistently and are willing to receive respectful feedback.",
    "You want to become a clearer, more emotionally intelligent and influential communicator.",
  ],
  founder: {
    heading: "Hi, This is Hashim.\nA community with a purpose.",
    paragraphs: [
      "Influency English is led by Mohamed Hashim. Its focus is practical: create room for people to use English, receive corrective feedback and keep speaking.",
      "The community is designed mainly around the needs of men starting or newly entering their careers. The aim is not only fluent sentences, but thoughtful communication — listening well, responding with care and expressing ideas clearly.",
    ],
    stats: [
      { value: "800+", label: "live sessions" },
      { value: "100+", label: "students supported" },
      { value: "9", label: "years of experience" },
    ],
  },
  outcomes: [
    {
      title: "Be effective",
      description:
        "Organise your thoughts and express what matters in interviews, meetings and everyday conversations.",
    },
    {
      title: "Be emotionally intelligent",
      description:
        "Listen with attention, recognise tone and respond with empathy instead of reacting automatically.",
    },
    {
      title: "Be influential",
      description:
        "Present your ideas with purpose, build trust and contribute with greater confidence.",
    },
  ],
} as const;

export type MemberCard =
  | {
      type: "stat";
      value: string;
      description: string;
      author?: string;
      accent?: boolean;
    }
  | { type: "portrait"; image: string; author: string; description: string }
  | {
      type: "photo";
      image: string;
      alt: string;
      author?: string;
      qualification?: string;
    }
  | {
      type: "video";
      video: string;
      label: string;
      author: string;
      qualification: string;
    }
  | { type: "quote"; quote: string; author?: string };
export const invitationStudent = {
  image: "/images/students/student_2.webp",
  alt: "Portrait of M Nihal",
  author: "M Nihal",
  qualification: "Software Engineer",
};

// Reorder cards within each row to arrange videos, quotes, and stats together.
export const heroRows: MemberCard[][] = [
  [
    {
      type: "video",
      video: "/videos/students/nihal-short.mp4",
      label: "M Nihal, Influency English student",
      author: "M Nihal",
      qualification: "",
    },
    {
      type: "quote",
      quote:
        "I used to know the answer, but I was too nervous to say it. Now I speak with more confidence.",
      author: "M Nihal",
    },
    {
      type: "stat",
      value: "3 times",
      description: "More speaking practice each week",
      accent: true,
    },
    {
      type: "video",
      video: "/videos/students/nuha-short.mp4",
      label: "Nuha A, Influency English student",
      author: "Nuha A",
      qualification: "",
    },
    {
      type: "quote",
      quote:
        "Before, I avoided conversations in English. Now I actually try to speak whenever I get the chance.",
      author: "Nuha A",
    },
    {
      type: "video",
      video: "/videos/students/jamsheer-short.mp4",
      label: "Jamsheer, Influency English student",
      author: "Jamsheer",
      qualification: "",
    },
    {
      type: "quote",
      quote:
        "The best part is the practice. I’m speaking more instead of only learning grammar.",
      author: "Jamsheer",
    },
    {
      type: "stat",
      value: "40 Days",
      description: "To build a consistent speaking habit",
      accent: true,
    },
  ],

  // bottom part
  [
    {
      type: "stat",
      value: "98%",
      description: "Members feel more confident in speaking",
      accent: true,
    },
    {
      type: "video",
      video: "/videos/students/minha-short.mp4",
      label: "Minha, Influency English student",
      author: "Minha",
      qualification: "",
    },
    {
      type: "quote",
      quote:
        "I don’t overthink every sentence anymore. Speaking English feels much more natural now.",
      author: "Ayisha Minha",
    },
    {
      type: "video",
      video: "/videos/students/noor-short.mp4",
      label: "Noor, Influency English student",
      author: "Noor",
      qualification: "",
    },
    {
      type: "quote",
      quote:
        "I can express my ideas much more clearly now, especially in meetings and interviews.",
      author: "Muhammad Noor",
    },
    // {
    //   type: "stat",
    //   value: "4+ Hours",
    //   description: "Guided speaking practice every month",
    // },
  ],
];

export const testimonials = [
  {
    placeholder: true,
    title: "A first-interview story",
    quote:
      "Add a consenting student’s own words about speaking in an interview, along with their context and date.",
    author: "Student proof placeholder — not a testimonial",
  },
  {
    placeholder: true,
    title: "A voice in the meeting",
    quote:
      "Add a verified student account of participating more comfortably in workplace conversations.",
    author: "Student proof placeholder — not a testimonial",
  },
  {
    placeholder: true,
    title: "A consistent practice habit",
    quote:
      "Add a real member’s experience of the Corrective Feedback Loop. Use only claims they approve.",
    author: "Student proof placeholder — not a testimonial",
  },
] as const;

export const faqs = [
  {
    question: "What is Influency English?",
    answer:
      "An online English-speaking practice community. Membership includes public-speaking practice, weekly mastermind discussions, communication resources, speaker-identity training, live speaking opportunities, corrective feedback and peer support.",
  },
  {
    question: "Do I need to speak fluent English already?",
    answer:
      "No. The community is designed for people who can understand some English but need practice using it. Bring a willingness to speak, listen and receive respectful feedback. Contact us before joining if you need help deciding whether the format suits you.",
  },
  {
    question: "Who is the community for?",
    answer:
      "Primarily people starting or newly entering their careers, with a focus on men navigating interviews, meetings, presentations and professional relationships. You must be at least 18 to subscribe.",
  },
  {
    question: "How does the Corrective Feedback Loop work?",
    answer:
      "You speak, receive specific feedback, correct one or more things, and repeat. The approach is inspired by natural language learning through interaction. Progress depends on your starting point and participation; fluency, employment and promotion are not guaranteed.",
  },
  {
    question: "What does membership cost?",
    answer:
      "₹499 per month or ₹399 per month on the yearly plan (₹4,788 billed annually), billed in INR. A year paid monthly would cost ₹5,988, so the yearly plan saves ₹1,200 — about 20% off. The yearly plan is charged in one payment, not monthly instalments.",
  },
  {
    question: "Will my subscription renew automatically?",
    answer:
      "Yes, if you authorise recurring payment in Razorpay Checkout. Monthly and yearly plans renew at their respective billing intervals until cancelled or the mandate expires. Renewal terms are shown before payment; see the subscription policy for cancellation instructions.",
  },
  {
    question: "How do I get access and the session schedule?",
    answer:
      "After a full membership payment is verified, onboarding instructions and community access details are sent to the email used at checkout within 2 business days. Sessions and resources are delivered online. The final platform, live-session timings and course catalogue must be confirmed before live enrolment opens.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes you can cancel anytime. No contracts. Though most people stay because it keeps working. Any issue email to hello@influenceyenglish.com or call +91 99476 01539.",
  },
] as const;
