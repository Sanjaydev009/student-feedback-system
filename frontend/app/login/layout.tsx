export const metadata = {
  title: 'Student Feedback System - Login',
  description: 'Login to Student Feedback System',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="login-layout">
      {children}
    </div>
  )
}
