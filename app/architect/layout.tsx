// File: @/app/architect/layout.tsx
// Описание: Layout для Architect режима


export default function ArchitectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
