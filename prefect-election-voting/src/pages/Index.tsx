import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Vote, Users, CalendarDays, CheckCircle, Clock, Ban } from "lucide-react";
import eskBg from "@/assets/esk-bg.jpg";
import Header from "@/components/Header";
import { useElection } from "@/lib/electionContext";

const timelineSteps = [
{ icon: Vote, label: "Voting Period", date: "8th – 12th March", done: false, active: true },
{ icon: CheckCircle, label: "Results Announced", date: "14th March", done: false }];


const Index = () => {
  const { votingOpen } = useElection();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={eskBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220_60%_12%/0.75)] via-[hsl(220_60%_15%/0.7)] to-[hsl(220_60%_12%/0.85)]" />
        </div>
        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-2xl mx-auto text-center">
            {votingOpen ? (
              <div className="inline-flex items-center gap-2 bg-primary-foreground/10 border border-primary-foreground/15 rounded-full px-4 py-1.5 mb-6">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-primary-foreground/80 text-sm font-body">Voting is now open</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-full px-4 py-1.5 mb-6">
                <Ban className="w-4 h-4 text-red-400" />
                <span className="text-red-300 text-sm font-body">Voting is now closed</span>
              </div>
            )}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary-foreground mb-6 leading-tight">
              Student Council<br />
              <span className="text-gradient-gold">Elections {new Date().getFullYear()}</span>
            </h1>
            <p className="text-primary-foreground/70 text-lg md:text-xl font-body mb-8 max-w-lg mx-auto">
              Teachers — cast your vote to help shape the next generation of ESK leaders.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/login">
                <Button size="lg" className="bg-gradient-gold text-secondary-foreground font-semibold hover:opacity-90 shadow-gold text-base px-8">
                  <Vote className="w-5 h-5 mr-2" />
                  {votingOpen ? "Vote Now" : "View Status"}
                </Button>
              </Link>
              <Link to="/candidates">
                <Button size="lg" variant="outline" className="border-primary-foreground/25 text-primary-foreground hover:bg-primary-foreground/10 text-base px-8">
                  View Candidates
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Rules */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-3">Election Rules</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-md mx-auto">Please review the rules before casting your vote.</p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
            { icon: Shield, title: "Secure & Private", desc: "All votes are confidential and securely stored. Your choices remain anonymous." },
            { icon: Vote, title: "One Vote Per Teacher", desc: "Each teacher may vote once. Votes cannot be changed after submission." },
            { icon: CheckCircle, title: "Prefect Selection", desc: "Vote for up to 10 Prefects from the candidate list." }].
            map((rule) =>
            <div key={rule.title} className="bg-card border border-border rounded-lg p-6 shadow-card text-center">
                <div className="w-12 h-12 rounded-full bg-gold-light flex items-center justify-center mx-auto mb-4">
                  <rule.icon className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="font-display font-semibold text-card-foreground mb-2">{rule.title}</h3>
                <p className="text-sm text-muted-foreground">{rule.desc}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 md:py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">Voting Timeline</h2>
          <div className="max-w-3xl mx-auto">
            <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
              {timelineSteps.map((step, i) =>
              <div key={step.label} className={`relative flex flex-col items-center text-center p-4 rounded-lg border ${
              step.active ? "bg-gold-light/40 border-accent shadow-gold" : step.done ? "bg-card border-border" : "bg-card border-border opacity-60"}`
              }>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${
                step.active ? "bg-gradient-gold" : step.done ? "bg-success" : "bg-muted"}`
                }>
                    {step.done ?
                  <CheckCircle className="w-5 h-5 text-success-foreground" /> :
                  step.active ?
                  <Clock className="w-5 h-5 text-secondary-foreground" /> :

                  <step.icon className="w-5 h-5 text-muted-foreground" />
                  }
                  </div>
                  <h4 className="font-body font-semibold text-sm text-card-foreground mb-1">{step.label}</h4>
                  <span className="text-xs text-muted-foreground">{step.date}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-navy mt-auto py-6">
        <div className="container mx-auto px-4 text-center">
          

          
        </div>
      </footer>
    </div>);

};

export default Index;