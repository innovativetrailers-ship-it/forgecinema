import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#0c0c10] via-[#111118] to-[#0c0c10] items-center justify-center overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00e5c8]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 px-16 space-y-8 max-w-lg">
          <div className="space-y-4">
            <div className="text-5xl font-bold tracking-tight">
              <span className="text-foreground">CINÉMA</span>
            </div>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Join thousands of creators making professional-grade video with AI.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '15+', label: 'AI video models' },
              { value: '50', label: 'Free credits on signup' },
              { value: '4K', label: 'Max export resolution' },
              { value: '∞', label: 'Projects per account' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/[0.03] border border-border/20 rounded-xl p-4"
              >
                <div className="text-2xl font-bold text-[#00e5c8]">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border/20">
            <p className="text-xs text-muted-foreground/60">
              No credit card required to get started
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}
