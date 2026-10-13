import { Hero } from "@/components/sections/Hero";
import { StudentProof, Proof } from "@/components/sections/Proof";
import { Problem } from "@/components/sections/Problem";
import { Overview } from "@/components/sections/Overview";
import { Benefits } from "@/components/sections/Benefits";
import { Audience } from "@/components/sections/Audience";
import { Founder } from "@/components/sections/Founder";
import { Invitation } from "@/components/sections/Invitation";
import { Pricing } from "@/components/sections/Pricing";
import { FAQ } from "@/components/sections/FAQ";
import { Footer } from "@/components/sections/Footer";
export default function Home() {
  return (
    <>
      <main id="main-content">
        <Hero />
        <StudentProof />
        <Problem />
        <Overview />
        <Benefits />
        <Audience />
        <Founder />
        <Invitation />
        <Proof />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
