import { Hero } from "@/components/sections/Hero";
import { StudentProof, Proof } from "@/components/sections/Proof";
import { Problem } from "@/components/sections/Problem";
import { Overview } from "@/components/sections/Overview";
import { ShadowGym } from "@/components/sections/ShadowGym";
import { Benefits } from "@/components/sections/Benefits";
import { Audience } from "@/components/sections/Audience";
import { Founder } from "@/components/sections/Founder";
import { BeforeAfter } from "@/components/sections/BeforeAfter";
import { Invitation } from "@/components/sections/Invitation";
import { Pricing } from "@/components/sections/Pricing";
import { FAQ } from "@/components/sections/FAQ";
import { Footer } from "@/components/sections/Footer";
export default function Home() {
  return (
    <>
      <main id="main-content">
        <Hero />
        {/* <StudentProof /> */}
        <Problem />
        <Overview />
        <ShadowGym />
        {/* <Benefits /> */}
        <Audience />
        {/* <Invitation /> */}
        <Proof />
        <BeforeAfter />
        <Founder />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
