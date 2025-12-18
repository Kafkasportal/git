'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Heart,
  Users,
  BarChart3,
  Calendar,
  MessageSquare,
  Shield,
  ChevronDown,
  ArrowRight,
  Quote,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

// ============================================================================
// GEOMETRIC BACKGROUND COMPONENT
// ============================================================================
function GeometricBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-transparent" />
      
      {/* Triangles */}
      <svg className="absolute top-20 right-10 w-64 h-64 text-primary/5" viewBox="0 0 100 100">
        <polygon points="50,10 90,90 10,90" fill="currentColor" />
      </svg>
      <svg className="absolute top-40 right-40 w-32 h-32 text-primary/10" viewBox="0 0 100 100">
        <polygon points="50,10 90,90 10,90" fill="currentColor" />
      </svg>
      
      {/* Hexagons */}
      <svg className="absolute bottom-20 left-10 w-48 h-48 text-primary/5" viewBox="0 0 100 100">
        <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="currentColor" />
      </svg>
      <svg className="absolute top-60 left-1/4 w-24 h-24 text-primary/8" viewBox="0 0 100 100">
        <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="currentColor" />
      </svg>
      
      {/* Abstract lines */}
      <div className="absolute top-1/3 right-1/4 w-px h-40 bg-gradient-to-b from-transparent via-primary/20 to-transparent rotate-45" />
      <div className="absolute bottom-1/3 left-1/3 w-px h-32 bg-gradient-to-b from-transparent via-primary/15 to-transparent -rotate-12" />
      
      {/* Diamond shapes */}
      <svg className="absolute top-1/2 right-20 w-16 h-16 text-primary/10" viewBox="0 0 100 100">
        <polygon points="50,0 100,50 50,100 0,50" fill="currentColor" />
      </svg>
    </div>
  );
}

// ============================================================================
// ANIMATED COUNTER COMPONENT
// ============================================================================
interface CounterProps {
  readonly end: number;
  readonly suffix?: string;
  readonly prefix?: string;
  readonly duration?: number;
}

function AnimatedCounter({ end, suffix = '', prefix = '', duration = 2 }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString('tr-TR')}{suffix}
    </span>
  );
}

// ============================================================================
// FEATURE CARD COMPONENT
// ============================================================================
interface FeatureCardProps {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly description: string;
  readonly index: number;
}

function FeatureCard({ icon, title, description, index }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="group relative bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:border-primary/20 transition-all duration-300"
    >
      {/* Icon container */}
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        <div className="text-white">
          {icon}
        </div>
      </div>
      
      <h3 className="font-heading text-xl font-semibold text-slate-900 mb-3">
        {title}
      </h3>
      <p className="text-slate-600 leading-relaxed">
        {description}
      </p>
      
      {/* Hover accent */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary to-primary-400 rounded-b-2xl scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </motion.div>
  );
}

// ============================================================================
// STEP COMPONENT
// ============================================================================
interface StepProps {
  readonly number: number;
  readonly title: string;
  readonly description: string;
  readonly isLast?: boolean;
}

function Step({ number, title, description, isLast = false }: StepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: number * 0.2 }}
      className="relative flex gap-6"
    >
      {/* Number and line */}
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white font-heading text-2xl font-bold shadow-lg shadow-primary/30">
          {number}
        </div>
        {!isLast && (
          <div className="w-0.5 h-full min-h-[80px] bg-gradient-to-b from-primary/50 to-transparent mt-4" />
        )}
      </div>
      
      {/* Content */}
      <div className="pb-12">
        <h3 className="font-heading text-xl font-semibold text-slate-900 mb-2">
          {title}
        </h3>
        <p className="text-slate-600 leading-relaxed max-w-md">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// TESTIMONIAL COMPONENT
// ============================================================================
const testimonials = [
  {
    quote: "KAFKASDER platformu sayesinde bağış yönetimimiz tamamen dijitalleşti. Artık tüm süreçlerimizi tek bir yerden takip edebiliyoruz.",
    author: "Ahmet Yılmaz",
    role: "Dernek Başkanı",
    organization: "Kafkas Yardımlaşma Derneği"
  },
  {
    quote: "İhtiyaç sahiplerine ulaşmak ve yardımları koordine etmek hiç bu kadar kolay olmamıştı. Gerçekten profesyonel bir sistem.",
    author: "Fatma Demir",
    role: "Gönüllü Koordinatörü",
    organization: "Sosyal Yardım Vakfı"
  },
  {
    quote: "Raporlama özellikleri sayesinde şeffaflık sağlıyor ve bağışçılarımıza detaylı bilgi sunabiliyoruz.",
    author: "Mehmet Kaya",
    role: "Mali İşler Sorumlusu",
    organization: "Eğitim Destek Derneği"
  }
];

function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative">
      {/* Large quotation mark */}
      <Quote className="absolute -top-8 -left-4 w-24 h-24 text-primary/10" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <blockquote className="text-2xl md:text-3xl font-heading text-slate-800 leading-relaxed mb-8">
            &ldquo;{testimonials[current].quote}&rdquo;
          </blockquote>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white font-bold text-lg">
              {testimonials[current].author.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-slate-900">{testimonials[current].author}</div>
              <div className="text-slate-500 text-sm">{testimonials[current].role}</div>
              <div className="text-primary text-sm font-medium">{testimonials[current].organization}</div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Indicators */}
      <div className="flex gap-2 mt-8">
        {testimonials.map((testimonial, index) => (
          <button
            key={`${testimonial.author}-${testimonial.role}`}
            onClick={() => setCurrent(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === current ? 'w-8 bg-primary' : 'bg-slate-300 hover:bg-slate-400'
            }`}
            aria-label={`Testimonial ${index + 1}: ${testimonial.author}`}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// SCROLL INDICATOR COMPONENT
// ============================================================================
function ScrollIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5, duration: 0.5 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
    >
      <span className="text-sm text-slate-500 font-medium">Keşfet</span>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="w-6 h-6 text-primary" />
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function LandingPage() {
  const features = [
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Bağış Yönetimi",
      description: "Nakdi ve ayni bağışları tek platformdan yönetin. Otomatik makbuz oluşturma ve takip sistemi."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "İhtiyaç Sahipleri",
      description: "İhtiyaç sahiplerini kategorize edin, başvuruları değerlendirin ve yardım dağıtımını planlayın."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Detaylı Raporlama",
      description: "Anlık istatistikler ve özelleştirilebilir raporlarla şeffaf yönetim sağlayın."
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Etkinlik Takvimi",
      description: "Kampanyaları, toplantıları ve etkinlikleri organize edin ve takip edin."
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "İletişim Merkezi",
      description: "Üyeler, gönüllüler ve bağışçılarla etkili iletişim kurun."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Güvenlik",
      description: "Kurumsal düzeyde güvenlik ile verilerinizi koruyun. KVKK uyumlu altyapı."
    }
  ];

  const steps = [
    {
      number: 1,
      title: "Hesap Oluşturun",
      description: "Derneğinizi kaydedin ve dakikalar içinde platformu kullanmaya başlayın."
    },
    {
      number: 2,
      title: "Verilerinizi Aktarın",
      description: "Mevcut üye, bağışçı ve ihtiyaç sahibi bilgilerinizi kolayca içe aktarın."
    },
    {
      number: 3,
      title: "Yönetmeye Başlayın",
      description: "Tüm dernek operasyonlarınızı tek bir platform üzerinden profesyonelce yönetin."
    }
  ];

  return (
    <main className="relative">
      {/* ================================================================
          HERO SECTION
          ================================================================ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <GeometricBackground />
        
        <div className="container mx-auto px-6 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8"
            >
              <Sparkles className="w-4 h-4" />
              <span>Dernek Yönetiminde Yeni Nesil</span>
            </motion.div>
            
            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            >
              <span className="text-slate-900">Derneğinizi</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-primary-600 to-primary-700 bg-clip-text text-transparent">
                Profesyonelce Yönetin
              </span>
            </motion.h1>
            
            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Bağış toplama, ihtiyaç sahibi takibi ve gönüllü koordinasyonu için{' '}
              <span className="text-slate-800 font-medium">tek platform</span>.
            </motion.p>
            
            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col flex-row gap-4 justify-center"
            >
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5"
              >
                Giriş Yap
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-slate-200 hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5"
              >
                Demo İncele
              </button>
            </motion.div>
          </div>
        </div>
        
        <ScrollIndicator />
      </section>

      {/* ================================================================
          STATS SECTION
          ================================================================ */}
      <section className="relative py-24 bg-slate-900 overflow-hidden">
        {/* Grid pattern background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
              Rakamlarla KAFKASDER
            </h2>
            <p className="text-slate-400 text-lg">
              Güvenilir ve etkili yardım koordinasyonu
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 grid-cols-4 gap-8">
            {[
              { value: 2500000, suffix: '₺', label: 'Toplam Bağış' },
              { value: 1250, suffix: '+', label: 'İhtiyaç Sahibi' },
              { value: 450, suffix: '+', label: 'Gönüllü' },
              { value: 85, suffix: '+', label: 'Aktif Proje' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="font-heading text-4xl md:text-5xl font-bold text-white mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-slate-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          FEATURES SECTION
          ================================================================ */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Özellikler</span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mt-4 mb-6">
              Platform Özellikleri
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Dernek yönetiminin tüm ihtiyaçlarını karşılayan kapsamlı çözümler
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          HOW IT WORKS SECTION
          ================================================================ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 gap-16 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-primary font-semibold text-sm uppercase tracking-wider">Nasıl Çalışır</span>
                <h2 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mt-4 mb-6">
                  3 Adımda Başlayın
                </h2>
                <p className="text-slate-600 text-lg mb-12">
                  Kurulum süreci hızlı ve kolay. Dakikalar içinde platformu kullanmaya başlayın.
                </p>
              </motion.div>
              
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <Step
                    key={step.number}
                    number={step.number}
                    title={step.title}
                    description={step.description}
                    isLast={index === steps.length - 1}
                  />
                ))}
              </div>
            </div>
            
            {/* Visual element */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative block"
            >
              <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl p-8 aspect-square">
                {/* Decorative elements */}
                <div className="absolute inset-4 bg-white rounded-2xl shadow-xl overflow-hidden">
                  <div className="h-12 bg-slate-900 flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="h-3 bg-slate-200 rounded w-3/4" />
                        <div className="h-2 bg-slate-100 rounded w-1/2 mt-2" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="h-3 bg-slate-200 rounded w-2/3" />
                        <div className="h-2 bg-slate-100 rounded w-2/5 mt-2" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="h-3 bg-slate-200 rounded w-4/5" />
                        <div className="h-2 bg-slate-100 rounded w-3/5 mt-2" />
                      </div>
                    </div>
                    <div className="mt-6 h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-16 h-16 text-primary/40" />
                    </div>
                  </div>
                </div>
                
                {/* Floating elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-4 -right-4 w-16 h-16 bg-primary rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center text-white"
                >
                  <Heart className="w-8 h-8" />
                </motion.div>
                
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -bottom-4 -left-4 w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center text-primary"
                >
                  <Users className="w-7 h-7" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================================================================
          TESTIMONIALS SECTION
          ================================================================ */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">Referanslar</span>
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mt-4 mb-8">
                Kullanıcılarımız Ne Diyor?
              </h2>
              
              <TestimonialCarousel />
            </motion.div>
            
            {/* Stats cards */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { value: '99%', label: 'Müşteri Memnuniyeti' },
                { value: '50+', label: 'Aktif Dernek' },
                { value: '24/7', label: 'Teknik Destek' },
                { value: '5 Yıl', label: 'Sektör Deneyimi' },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
                >
                  <div className="font-heading text-3xl font-bold text-primary mb-1">{item.value}</div>
                  <div className="text-slate-600 text-sm">{item.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================================================================
          CTA SECTION
          ================================================================ */}
      <section className="relative py-24 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900" />
        
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <svg className="absolute top-0 left-0 w-96 h-96 text-white/5" viewBox="0 0 100 100">
            <polygon points="50,10 90,90 10,90" fill="currentColor" />
          </svg>
          <svg className="absolute bottom-0 right-0 w-80 h-80 text-primary/10" viewBox="0 0 100 100">
            <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="currentColor" />
          </svg>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-6">
              Hemen Başlayın
            </h2>
            <p className="text-xl text-slate-300 mb-10">
              Derneğinizi dijital çağa taşıyın. Ücretsiz demo ile platformu keşfedin.
            </p>
            
            {/* Email signup */}
            <div className="flex flex-col flex-row gap-4 max-w-lg mx-auto mb-10">
              <input
                type="email"
                placeholder="E-posta adresiniz"
                className="flex-1 px-6 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button className="bg-primary hover:bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 whitespace-nowrap">
                Demo Talep Et
              </button>
            </div>
            
            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-6 text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>SSL Güvenlik</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>KVKK Uyumlu</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>7/24 Destek</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer className="py-12 bg-slate-900 border-t border-slate-800">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                  K
                </div>
                <span className="font-heading text-xl font-bold text-white">KAFKASDER</span>
              </div>
              <p className="text-slate-400 max-w-sm">
                Dernek yönetiminde profesyonel çözümler. Bağış yönetimi, ihtiyaç sahibi takibi ve gönüllü koordinasyonu.
              </p>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-slate-400">
                <li><button type="button" className="hover:text-primary transition-colors text-left">Özellikler</button></li>
                <li><button type="button" className="hover:text-primary transition-colors text-left">Fiyatlandırma</button></li>
                <li><button type="button" className="hover:text-primary transition-colors text-left">Demo</button></li>
                <li><button type="button" className="hover:text-primary transition-colors text-left">SSS</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Yasal</h4>
              <ul className="space-y-2 text-slate-400">
                <li><button type="button" className="hover:text-primary transition-colors text-left">Gizlilik Politikası</button></li>
                <li><button type="button" className="hover:text-primary transition-colors text-left">Kullanım Şartları</button></li>
                <li><button type="button" className="hover:text-primary transition-colors text-left">KVKK</button></li>
                <li><button type="button" className="hover:text-primary transition-colors text-left">İletişim</button></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom */}
          <div className="pt-8 border-t border-slate-800 flex flex-col flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} KAFKASDER. Tüm hakları saklıdır.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="text-slate-400 hover:text-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-slate-400 hover:text-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-slate-400 hover:text-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
