/** Single source for public offer content. Amounts are in INR paise. */
export const plans = {
  monthly: {
    id: "monthly",
    label: "Monthly",
    amount: 50_000,
    displayPrice: "₹500",
    cadence: "month",
    period: "monthly",
    totalCount: 120,
    description: "A month of guided English-speaking practice",
  },
  yearly: {
    id: "yearly",
    label: "Yearly",
    amount: 500_000,
    displayPrice: "₹5,000",
    cadence: "year",
    period: "yearly",
    totalCount: 10,
    description: "Twelve months of practice for the price of ten",
  },
} as const;
export type PlanKey = keyof typeof plans;

export const site = {
  name: "Influencey English",
  joinHref: "#pricing",
  email: "hello@influenceyenglish.com",
  hero: {
    heading: "Speak English with clarity.\nShow up with confidence.",
    description:
      "A speaking-practice community for people starting their careers. Build the English, emotional intelligence and confidence to make your voice count — one conversation at a time.",
    note: "₹500/month · ₹5,000/year · Guided speaking practice",
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
    callout: "Confidence grows through practice, not perfect grammar.",
    images: [
      {
        src: "/images/planner.png",
        alt: "Illustrative workplace preparation scene",
      },
      { src: "/images/coach.png", alt: "Illustrative speaking practice scene" },
      {
        src: "/images/workshop.png",
        alt: "Illustrative group conversation scene",
      },
      {
        src: "/images/discussion.png",
        alt: "Illustrative peer discussion scene",
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
    "Public-speaking practice",
    "Weekly mastermind discussions",
    "Communication courses and resources",
    "Speaker-identity training",
    "Live public-speaking opportunities",
    "Corrective feedback",
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
    "You are a student, graduate or professional newly entering your career.",
    "You understand some English but hesitate to speak in interviews, meetings or groups.",
    "You want to practise consistently and are willing to receive respectful feedback.",
    "You want to become a clearer, more emotionally intelligent and influential communicator.",
  ],
  founder: {
    heading: "Meet Hashim.\nA community with a purpose.",
    paragraphs: [
      "Influencey English is led by Mohamed Hashim. Its focus is practical: create room for people to use English, receive corrective feedback and keep speaking.",
      "The community is designed mainly around the needs of men starting or newly entering their careers. The aim is not only fluent sentences, but thoughtful communication — listening well, responding with care and expressing ideas clearly.",
      "Hashim’s full personal story and portrait will be added here once approved. No qualifications, achievements or student results are claimed in this placeholder biography.",
    ],
    stats: [
      { value: "Speak", label: "Use what you know" },
      { value: "Reflect", label: "Notice the difference" },
      { value: "Repeat", label: "Build a habit" },
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
      author: string;
      accent?: boolean;
    }
  | { type: "portrait"; image: string; author: string; description: string }
  | { type: "quote"; quote: string; author: string };
export const heroRows: MemberCard[][] = [
  [
    {
      type: "stat",
      value: "Speak",
      description: "Real conversations. Real practice.",
      author: "The CFL approach",
      accent: true,
    },
    {
      type: "quote",
      quote: "Your next conversation can be your next learning opportunity.",
      author: "Speak · Feedback · Correct · Repeat",
    },
    {
      type: "stat",
      value: "₹500",
      description: "Monthly speaking community",
      author: "INR · Recurring membership",
    },
  ],
  [
    {
      type: "stat",
      value: "Listen",
      description: "Understand people, not just words.",
      author: "Emotional intelligence",
    },
    {
      type: "quote",
      quote: "A clearer voice starts with the courage to use it.",
      author: "A practice mindset, not a student testimonial",
    },
    {
      type: "stat",
      value: "₹5,000",
      description: "A full year. Two months free.",
      author: "Compared with 12 monthly payments",
      accent: true,
    },
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
    question: "What is Influencey English?",
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
      "₹500 per month or ₹5,000 per year, billed in INR. A year paid monthly would cost ₹6,000, so the yearly plan saves ₹1,000 — the equivalent of two monthly payments. The yearly plan is charged in one payment, not monthly instalments.",
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
    question: "Can I cancel or request a refund?",
    answer:
      "Email hello@influenceyenglish.com or call +91 99476 01539. Provisional policy: first-payment refund requests within 7 calendar days; cancellation requests actioned within 2 business days; approved refunds initiated within 5–7 business days. Review the refund and subscription policies before paying.",
  },
] as const;
