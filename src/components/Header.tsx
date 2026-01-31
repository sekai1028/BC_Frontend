import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import aegisIcon from '../public/asset/aegis.svg'
import goldIcon from '../public/asset/gold.svg'
import rankIcon from '../public/asset/Rank.svg'
import powerLevelIcon from '../public/asset/power_level.svg'
import mercyIcon from '../public/asset/mercy.svg'
import enterVaultIcon from '../public/asset/enter_the_vault.svg'

export default function Header() {
  const { gold, mercyPot } = useGameStore()
  const { user } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  const formatGold = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K`
    return amount.toFixed(0)
  }

  const segmentStyle = {
    background: 'rgba(0,0,0,0.45)',
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
    borderRadius: '12px',
    padding: '10px 14px',
    minHeight: '60px',
  }

  const iconBox = (bg: string) => ({
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    background: bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
  })

  return (
    <header
      className="w-full max-w-[1730px] flex justify-center mx-auto my-5 sm:my-6 lg:my-[22px] lg:mb-8 px-2 sm:px-4"
      style={{
        minHeight: '80px',
        height: 'auto',
        background: '#151515',
        border: '1px solid #FFFFFF0D',
        borderRadius: '16px',
        boxShadow:
          '5px 5px 15px 0px #00000066, -2px -2px 5px 1px #00000080 inset, 2px 2px 5px 1px #FFFFFF0D inset',
      }}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 lg:gap-4 w-full py-3 px-2 sm:px-4">
        {/* Left Section */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto scrollbar-hide">
          <div
            className="flex items-center gap-2 sm:gap-3 flex-shrink-0"
            style={{
              width: 'auto',
              minWidth: 120,
              height: 60,
              opacity: 0.86,
              marginLeft: 0,
              borderRadius: 8,
              background: '#0A1410',
              borderBottom: '1px solid #FFFFFF1A',
              backdropFilter: 'blur(4px)',
              boxShadow: '5px 5px 15px 0px #00000066, -2px -2px 5px 1px #00000080 inset, 2px 2px 5px 1px #FFFFFF0D inset',
            }}
          >
            <div className="flex items-center justify-center">
              <img 
                src={aegisIcon} 
                alt="AEGIS" 
                className="w-6 h-6 sm:w-8 sm:h-8"
              />
            </div>
            <span className="text-sm sm:text-base lg:text-lg font-bold text-bunker-green font-mono tracking-wide" 
              style={{ fontWeight: 700, color: '#21AD55' }}
            >AEGIS</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0"
            style={{
              width: 'auto',
              minWidth: 140,
              height: 60,
              opacity: 0.86,
              borderRadius: 8,
              background: '#0A1410',
              borderBottom: '1px solid #FFFFFF1A',
              backdropFilter: 'blur(4px)',
              boxShadow: '5px 5px 15px 0px #00000066, -2px -2px 5px 1px #00000080 inset, 2px 2px 5px 1px #FFFFFF0D inset',
            }}
          >
            <div 
              style={{
                width:42,
                height:42,
                marginTop:20,
                marginLeft:16,
                marginBottom:20,
                paddingTop:6,
                paddingRight:8,
                paddingBottom:6,
                paddingLeft:8,
                background:'#7A5A1A',
                display: 'flex',
                alignItems:'center',
                justifyContent:'center',
                borderRadius:5
              }}
            >
              <img 
                src={goldIcon} 
                alt="Gold" 
                className="w-5 h-5"
                style={{width:25, height:30}}
              />
            </div>
            <div className="leading-tight" style={{marginLeft: 12}}>
              <div className="text-[11px] text-[#C7C7C7] font-mono uppercase" style={{fontWeight:400, fontSize:'11px', color:'#FFFF00'}}>Gold Balance</div>
              <div className="text-lg font-extrabold font-mono text-[#C6FF74]" style={{ textShadow: '0 0 6px rgba(198,255,116,0.6)' , color:'#FFFF00'}}>
                {formatGold(gold)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 hidden sm:flex"
            style={{
              width: 'auto',
              minWidth: 130,
              height: 60,
              opacity: 0.86,
              borderRadius: 8,
              background: '#0A1410',
              borderBottom: '1px solid #FFFFFF1A',
              backdropFilter: 'blur(4px)',
              boxShadow: '5px 5px 15px 0px #00000066, -2px -2px 5px 1px #00000080 inset, 2px 2px 5px 1px #FFFFFF0D inset',
            }}>
            <div 
              style={{
                width:42,
                height:40,
                marginTop:20,
                marginLeft:16,
                marginBottom:20,
                display: 'flex',
                alignItems:'center',
                justifyContent:'center',
                borderRadius:4
              }}
            >
              <img 
                src={rankIcon} 
                alt="Rank" 
                className="w-5 h-5"
                style={{width:42, height:40}}
              />
            </div>
            <div className="leading-tight">
              <div className="text-[11px] text-[#C7C7C7] font-mono uppercase" style={{color:'#B68CE5'}}>Exile Rank</div>
              <div className="text-lg font-extrabold font-mono text-[#B39CFF]" style={{ textShadow: '0 0 6px rgba(179,156,255,0.6)' }}>
                CLASS {user?.rank || 0}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 hidden md:flex"
            style={{
              width: 'auto',
              minWidth: 180,
              height: 60,
              opacity: 0.86,
              paddingLeft:26,
              paddingTop:12,
              paddingBottom:12,
              paddingRight:26,
              borderRadius: 8,
              background: '#0A1410',
              borderBottom: '1px solid #FFFFFF1A',
              backdropFilter: 'blur(4px)',
              boxShadow: '5px 5px 15px 0px #00000066, -2px -2px 5px 1px #00000080 inset, 2px 2px 5px 1px #FFFFFF0D inset',
            }}>
            <div>
              <img 
                src={powerLevelIcon} 
                alt="Power Level" 
                className="w-5 h-5"
              />
            </div>
            <div className="leading-tight w-full">
              <div className="flex items-center justify-between text-[11px] text-[#8AC7FF] font-mono uppercase">
                <span>Power Core Level</span>
                <span>86%</span>
              </div>
              <div className="w-full h-4 bg-[#0F1A2A] mt-1 rounded-full overflow-hidden border border-[#244a7a]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: '86%',
                    background: 'linear-gradient(90deg, #3FA2FF 0%, #7EC8FF 100%)',
                    boxShadow: '0 0 8px rgba(126,200,255,0.6)',
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 hidden sm:flex"
            style={{
              width: 'auto',
              minWidth: 150,
              height: 60,
              opacity: 0.86,
              borderRadius: 8,
              background: '#0A1410',
              borderBottom: '1px solid #FFFFFF1A',
              backdropFilter: 'blur(4px)',
              boxShadow: '5px 5px 15px 0px #00000066, -2px -2px 5px 1px #00000080 inset, 2px 2px 5px 1px #FFFFFF0D inset',
            }}>
            <div>
              <img 
                src={mercyIcon} 
                alt="Mercy Pot" 
                className="w-5 h-5"
                style={{width:42, height:39, marginLeft:16, marginTop:21, marginBottom:21, marginRight:16}}
              />
            </div>
            <div className="leading-tight">
              <div className="text-[11px] text-[#C7C7C7] font-mono uppercase" style={{color:'#2DE85C'}}>Global Mercy Pot</div>
              <div className="text-lg font-extrabold font-mono text-bunker-green" style={{ textShadow: '0 0 6px rgba(0,255,0,0.5)' }}>
                ${mercyPot.toFixed(6)}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div
          className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 flex-shrink-0"
          style={{
            width: 'auto',
            minWidth: 200,
            height: '60px',
            borderRadius: '8px',
            background: '#0A130F',
            marginRight:20,
            opacity: 0.86,
            borderBottom: '1px solid #FFFFFF1A',
            backdropFilter: 'blur(4px)',
            justifyContent: 'space-between',
          }}
        >
          <Link
            to="/vault"
            className="flex items-center justify-center"
            style={{ padding: 0 }}
          >
            <img
              src={enterVaultIcon}
              alt="Enter the Vault"
              className="h-10 w-auto"
              style={{width:207, height:52}}
            />
          </Link>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-11 h-11 flex items-center justify-center rounded-md border border-white/10"
            style={{ background: '#15341E', width:44, height:44}}
            aria-label="Open menu"
          >
            <span className="text-white text-xl">≡</span>
          </button>
        </div>
      </div>
      
      {menuOpen && (
        <nav className="mt-4 border-t border-gray-800 pt-4">
          <div className="flex flex-col gap-2 font-mono">
            <Link to="/" className="hover:text-bunker-green transition text-sm">Terminal</Link>
            <Link to="/profile" className="hover:text-bunker-green transition text-sm">Exile Profile</Link>
            <Link to="/shop" className="hover:text-bunker-green transition text-sm">Black Market</Link>
            <Link to="/leaderboard" className="hover:text-bunker-green transition text-sm">Leaderboard</Link>
            <Link to="/intel" className="hover:text-bunker-green transition text-sm">Intel & FAQ</Link>
            <Link to="/legal" className="hover:text-bunker-green transition text-sm">Legal</Link>
          </div>
        </nav>
      )}
    </header>
  )
}
