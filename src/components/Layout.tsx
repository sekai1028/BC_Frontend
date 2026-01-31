import { ReactNode } from 'react'
import Header from './Header'
import GlobalChat from './GlobalChat'
import LeftSidebar from './LeftSidebar'
import backgroundImg from '../public/asset/background.png'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div
      className="min-h-screen text-white flex flex-col w-full overflow-x-hidden"
      style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#000',
      }}
    >
      <div className="flex justify-center w-full px-4 sm:px-6 lg:px-8">
        <Header />
      </div>
      <div className="flex flex-1 flex-col lg:flex-row px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 lg:pt-[20px] pb-6 gap-4 lg:gap-6 overflow-x-hidden scrollbar-hide">
        <div className="hidden lg:block flex-shrink-0">
          <LeftSidebar />
        </div>
        <main className="flex-1 min-w-0 flex justify-center w-full">
          {children}
        </main>
        <div className="hidden lg:block">
          <GlobalChat />
        </div>
      </div>
    </div>
  )
}
