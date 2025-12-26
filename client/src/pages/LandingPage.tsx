import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Send,
  Search,
  Users,
  Award,
  FileCheck,
  ArrowRight,
  CheckCircle2,
  Shield,
  Clock,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
  FloatingElement,
} from "@/components/AnimationWrappers";

const stats = [
  { label: "Papers Submitted", value: 12847, suffix: "+" },
  { label: "Expert Reviewers", value: 3256, suffix: "" },
  { label: "Acceptance Rate", value: 24, suffix: "%" },
  { label: "Countries", value: 89, suffix: "" },
];

const features = [
  {
    icon: Shield,
    title: "Double-Blind Review",
    description:
      "Complete anonymity between authors and reviewers ensures unbiased evaluation.",
  },
  {
    icon: Clock,
    title: "Fast Turnaround",
    description:
      "Average review cycle of 4-6 weeks with real-time status tracking.",
  },
  {
    icon: FileCheck,
    title: "Version Control",
    description:
      "Full revision history with diff comparison and timeline view.",
  },
  {
    icon: Award,
    title: "Quality Assurance",
    description: "Multi-stage review process with expert committee oversight.",
  },
];

const testimonials = [
  {
    quote:
      "The most streamlined peer review experience I've ever had. The platform is intuitive and the review process is transparent.",
    author: "Dr. Sarah Chen",
    role: "Professor of Computer Science, MIT",
  },
  {
    quote:
      "As a reviewer, I appreciate the clean interface and the ability to track all my assignments in one place.",
    author: "Prof. James Miller",
    role: "Research Director, Oxford University",
  },
  {
    quote:
      "Our conference proceedings have never been more organized. JournalHub transformed our workflow.",
    author: "Dr. Maria Santos",
    role: "Conference Chair, ICML 2025",
  },
];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <PageTransition className="min-h-screen bg-background">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-serif-roboto text-xl font-semibold">
              JournalHub
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/browse"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Browse Papers
            </Link>
            <Link
              to="/about"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link
              to="/faq"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="btn-physics">
                Sign In
              </Button>
            </Link>
            <Link to="/login?action=submit">
              <Button
                size="sm"
                className="btn-physics bg-gradient-primary hover:opacity-90"
              >
                Submit Paper
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
      >
        {/* Animated background */}
        <div className="absolute inset-0 animated-gradient" />
        <div className="absolute inset-0 bg-mesh-pattern opacity-50" />

        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <FloatingElement delay={0} className="absolute top-1/4 left-[10%]">
            <div className="h-32 w-24 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm border border-primary/20 rotate-[-15deg]" />
          </FloatingElement>
          <FloatingElement delay={1} className="absolute top-1/3 right-[15%]">
            <div className="h-40 w-28 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 backdrop-blur-sm border border-accent/20 rotate-[10deg]" />
          </FloatingElement>
          <FloatingElement delay={2} className="absolute bottom-1/4 left-[20%]">
            <div className="h-28 w-20 rounded-lg bg-gradient-to-br from-info/20 to-info/5 backdrop-blur-sm border border-info/20 rotate-[5deg]" />
          </FloatingElement>
          <FloatingElement
            delay={0.5}
            className="absolute bottom-1/3 right-[25%]"
          >
            <div className="h-36 w-26 rounded-lg bg-gradient-to-br from-success/20 to-success/5 backdrop-blur-sm border border-success/20 rotate-[-8deg]" />
          </FloatingElement>
        </div>

        {/* Hero content */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 container mx-auto px-4 text-center"
        >
          <StaggerContainer className="max-w-4xl mx-auto">
            <StaggerItem>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 mb-8"
              >
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                <span className="text-sm text-accent font-medium">
                  Conference 2026 Submissions Open
                </span>
              </motion.div>
            </StaggerItem>

            <StaggerItem>
              <h1 className="font-serif-outfit text-5xl md:text-7xl font-bold leading-tight mb-6">
                <span className="text-foreground">Elevate Your</span>
                <br />
                <span className="text-gradient-primary">
                  Scientific Publishing
                </span>
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                A premium platform for blind peer review and journal management.
                Submit, review, and publish with confidence.
              </p>
            </StaggerItem>

            <StaggerItem>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/login?action=submit">
                  <Button
                    size="lg"
                    className="btn-physics bg-gradient-primary hover:opacity-90 text-lg px-8 py-6 glow-primary"
                  >
                    <Send className="mr-2 h-5 w-5" />
                    Submit Your Paper
                  </Button>
                </Link>
                <Link to="/browse">
                  <Button
                    variant="outline"
                    size="lg"
                    className="btn-physics text-lg px-8 py-6 border-border/50 hover:bg-muted"
                  >
                    <Search className="mr-2 h-5 w-5" />
                    Explore Published Papers
                  </Button>
                </Link>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground"
        >
          <ChevronDown className="h-6 w-6" />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-foreground mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif-outfit text-4xl md:text-5xl font-bold text-foreground mb-4">
              Why Choose{" "}
              <span className="text-gradient-accent">JournalHub</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built by researchers, for researchers. Experience the future of
              academic publishing.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="glass-card p-6 group"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-serif-outfit text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif-outfit text-4xl md:text-5xl font-bold text-foreground mb-4">
              How It <span className="text-gradient-primary">Works</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A streamlined process from submission to publication.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {[
              {
                step: 1,
                title: "Submit",
                desc: "Upload your paper with metadata and keywords",
              },
              {
                step: 2,
                title: "Review",
                desc: "Expert reviewers evaluate your work anonymously",
              },
              {
                step: 3,
                title: "Revise",
                desc: "Address feedback through our version control system",
              },
              {
                step: 4,
                title: "Publish",
                desc: "Accepted papers are published to our public archive",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative flex items-center gap-8 mb-8 last:mb-0"
              >
                <div className="flex-shrink-0 h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground glow-primary">
                  {item.step}
                </div>
                <div className="flex-1 glass-card p-6">
                  <h3 className="font-serif-outfit text-xl font-semibold text-foreground mb-1">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
                {index < 3 && (
                  <div className="absolute left-8 top-16 h-8 w-0.5 bg-gradient-to-b from-primary to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif-outfit text-4xl md:text-5xl font-bold text-foreground mb-4">
              Trusted by{" "}
              <span className="text-gradient-accent">Researchers</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of academics who trust JournalHub for their
              publishing needs.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-4 w-4 text-accent">
                      ★
                    </div>
                  ))}
                </div>
                <p className="text-foreground mb-6 italic">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-semibold text-foreground">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-dark" />
        <div className="absolute inset-0 bg-mesh-pattern opacity-30" />

        <div className="relative container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif-outfit text-4xl md:text-5xl font-bold text-foreground mb-6">
              Ready to Publish Your Research?
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Join our community of researchers and take the first step towards
              publication.
            </p>
            <Link to="/login?action=submit">
              <Button
                size="lg"
                className="btn-physics bg-gradient-accent text-accent-foreground hover:opacity-90 text-lg px-10 py-6 glow-accent"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-serif-roboto text-lg font-semibold">
                  JournalHub
                </span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Empowering researchers with modern publishing tools.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    to="/browse"
                    className="hover:text-foreground transition-colors"
                  >
                    Browse Papers
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-foreground transition-colors"
                  >
                    Submit Paper
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-foreground transition-colors"
                  >
                    Reviewer Portal
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    to="/about"
                    className="hover:text-foreground transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faq"
                    className="hover:text-foreground transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    to="/guidelines"
                    className="hover:text-foreground transition-colors"
                  >
                    Author Guidelines
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>support@journalhub.com</li>
                <li>+1 (555) 123-4567</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 JournalHub. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link
                to="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </PageTransition>
  );
}
