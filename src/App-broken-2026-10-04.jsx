import { useEffect, useState } from 'react'
import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react'
import {
  WalletModalProvider,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import '@solana/wallet-adapter-react-ui/styles.css'
import './App.css'
import { registerSeekerConnect } from '@solana-mobile/seeker-connect-wallet-standard'
import { getWallets } from '@wallet-standard/app'
import { StandardConnect } from '@wallet-standard/features'

registerSeekerConnect({
  identity: {
    name: 'Seeker Mission',
    uri: window.location.origin,
  },
  relayDomain: 'relay.solanamobile.com',
})

const SKR_MINT = new PublicKey('SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3')
function WalletInfo() {
  const connectSeeker = async () => {
    try {
      console.log("WALLETS:", getWallets().get().map(w => w.name))
      const wallet = getWallets()
        .get()
        .find((w) => w.name === 'Seeker Connect')

      if (!wallet) {
        setError('Seeker Connect縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ')
        return
      }

      console.log("CONNECT START", wallet.features[StandardConnect])
      const { accounts } = await wallet.features[StandardConnect].connect()
      console.log("CONNECT RESULT:", accounts)
      if (!accounts?.[0]) {
        setError('繧ｦ繧ｩ繝ｬ繝・ヨ謗･邯壹↓螟ｱ謨励＠縺ｾ縺励◆')
        return
      }
      setSeekerAddress(accounts[0].address)
      setSeekerAccount(accounts[0])
      setError('')
    } catch (err) {
      setError(err?.message || 'Seeker Connect縺ｸ縺ｮ謗･邯壹↓螟ｱ謨励＠縺ｾ縺励◆')
    }
  }

  const { connection } = useConnection()
  const { publicKey, connected, signMessage } = useWallet()

  const [balance, setBalance] = useState(null)
  const [seekerAddress, setSeekerAddress] = useState('')
  const [seekerAccount, setSeekerAccount] = useState(null)
  const [error, setError] = useState('')
  const [signatureStatus, setSignatureStatus] = useState('')
  const [showNext, setShowNext] = useState(false)
  const [checkedIn, setCheckedIn] = useState(() => {
    const today = new Date().toLocaleDateString('sv-SE')
    return localStorage.getItem('seekerCheckInDate') === today
  })
  const [points, setPoints] = useState(() => Number(localStorage.getItem('seekerPoints')) || 0)
  const [rewardUnlocked, setRewardUnlocked] = useState(() => localStorage.getItem('seekerRewardUnlocked') === 'true')
  const [streak, setStreak] = useState(() => Number(localStorage.getItem('seekerStreak')) || 1)
  const [testStreak, setTestStreak] = useState(null)
  const [bonusMessage, setBonusMessage] = useState('')
  const [seekerBonusClaimed, setSeekerBonusClaimed] = useState(() => {
    const today = new Date().toLocaleDateString('sv-SE')
    return localStorage.getItem('seekerBonusClaimDate') === today
  })
  const [skrBalance, setSkrBalance] = useState(null)
  const [skrChecked, setSkrChecked] = useState(false)
  const [skrError, setSkrError] = useState('')
  const [testSkrBalance, setTestSkrBalance] = useState(null)

  const effectiveSkrBalance =
    testSkrBalance !== null ? testSkrBalance : skrBalance
  const skrReward =
    effectiveSkrBalance >= 1000 ? 100 :
      effectiveSkrBalance >= 100 ? 50 :
        effectiveSkrBalance >= 1 ? 25 :
          0
  const skrSilverUnlocked = effectiveSkrBalance >= 100
  const effectiveStreak = testStreak !== null ? testStreak : streak
  const achievements = [{ id: 'first-checkin', title: '噫 First Check-in', unlocked: checkedIn }, { id: 'three-day-streak', title: '櫨 3 Day Streak', unlocked: effectiveStreak >= 3 }, { id: 'seven-day-streak', title: '櫨 7 Day Streak', unlocked: effectiveStreak >= 7 }, { id: 'skr-silver', title: '･・SKR Silver', unlocked: skrSilverUnlocked }]

  const skrRank =
    effectiveSkrBalance >= 1000 ? 'Gold' :
      effectiveSkrBalance >= 100 ? 'Silver' :
        effectiveSkrBalance >= 1 ? 'Bronze' :
          'Locked'
  const signTestMessage = async () => {
    try {
      if (!seekerAccount) {
        setSignatureStatus('蜈医↓Connect with Seeker縺励※縺上□縺輔＞')
        return
      }

      setSignatureStatus('鄂ｲ蜷阪ｒ貅門ｙ荳ｭ...')

      const wallet = getWallets()
        .get()
        .find((w) => w.name === 'Seeker Connect')

      const feature = wallet?.features['solana:signMessage']

      if (!feature) {
        throw new Error('Seeker Connect縺檎ｽｲ蜷阪↓蟇ｾ蠢懊＠縺ｦ縺・∪縺帙ｓ')
      }

      const message = new TextEncoder().encode('SEEKER BUILDER sign test')

      await feature.signMessage({
        account: seekerAccount,
        message,
      })

      setSignatureStatus('鄂ｲ蜷肴・蜉滂ｼ・)
    } catch (err) {
      setSignatureStatus(err?.message || '鄂ｲ蜷阪↓螟ｱ謨励＠縺ｾ縺励◆')
    }
  }
  const checkSkrBalance = async () => {
    if (!seekerAccount) {
      setSkrError('繧ｦ繧ｩ繝ｬ繝・ヨ繧呈磁邯壹＠縺ｦ縺上□縺輔＞')
      return
    }

    setSkrChecked(false)
    setSkrError('')

    try {
      const response = await fetch(
        '/api/solana-rpc',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getTokenAccountsByOwner',
            params: [
              seekerAccount.address,
              {
                mint: SKR_MINT.toBase58(),
              },
              {
                encoding: 'jsonParsed',
              },
            ],
          }),
        }
      )

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message)
      }

      const total = data.result.value.reduce((sum, account) => {
        const amount =
          account.account.data.parsed.info.tokenAmount.uiAmount || 0
        return sum + amount
      }, 0)

      setSkrBalance(total)
      setSkrChecked(true)
    } catch (err) {
      setSkrError(err?.message || 'SKR谿矩ｫ倥ｒ遒ｺ隱阪〒縺阪∪縺帙ｓ縺ｧ縺励◆')
    }
  }
  useEffect(() => {
    localStorage.setItem('seekerPoints', points)
  }, [points])
  useEffect(() => {
    localStorage.setItem('seekerStreak', streak)
  }, [streak])
  useEffect(() => {
    if (checkedIn) {
      const today = new Date().toLocaleDateString('sv-SE')
      localStorage.setItem('seekerCheckInDate', today)
    }
  }, [checkedIn])
  useEffect(() => {
    if (!publicKey) {
      setBalance(null)
      setError('')
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10000)

    const loadBalance = async () => {
      setBalance(null)
      setError('')

      try {
        const response = await fetch('https://api.devnet.solana.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getBalance',
            params: [publicKey.toBase58()],
          }),
          signal: controller.signal,
        })

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error.message)
        }

        setBalance(data.result.value / LAMPORTS_PER_SOL)
      } catch (err) {
        setError(
          err.name === 'AbortError'
            ? 'Devnet RPC timeout'
            : err.message
        )
      } finally {
        clearTimeout(timer)
      }
    }

    loadBalance()

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [publicKey])



  return (
    <div>
      <button onClick={connectSeeker}>Connect with Seeker</button>
      {seekerAddress && <p>Wallet: {seekerAddress.slice(0, 4)}...{seekerAddress.slice(-4)}</p>}
      {seekerAddress && (
        <div className="profile-card">
          <h3>醇 SEEKER PROFILE</h3>
          <p>Wallet: {seekerAddress.slice(0, 4)}...{seekerAddress.slice(-4)}</p>
          <p>箝・Points: {points}</p>
          <p>櫨 Streak: {streak} days</p>
          <p>事 Badge: {rewardUnlocked ? 'LIMITED HOLDER' : 'Locked'}</p>
        </div>
      )}
      <button onClick={signTestMessage}>Verify Wallet</button>
      {signatureStatus && <p>{signatureStatus}</p>}
      <button onClick={() => setShowNext(true)}>Open Missions</button>
      {showNext && (
        <div>
          <h2>TODAY'S MISSIONS</h2>
          <p>Daily missions</p>
          <ul>
            <li>笨・繧ｦ繧ｩ繝ｬ繝・ヨ謗･邯・/li>
            <li>笨・繝｡繝・そ繝ｼ繧ｸ鄂ｲ蜷・/li>
            <li>
              {checkedIn ? (
                '笨・繝・う繝ｪ繝ｼ繝√ぉ繝・け繧､繝ｳ螳御ｺ・
              ) : (
                <button onClick={() => {
                  const today = new Date()
                  const yesterday = new Date(today)
                  yesterday.setDate(today.getDate() - 1)

                  const yesterdayKey = yesterday.toLocaleDateString('sv-SE')
                  const lastCheckIn = localStorage.getItem('seekerCheckInDate')

                  const nextStreak = lastCheckIn === yesterdayKey ? streak + 1 : 1
                  const bonus = nextStreak === 7 ? 50 : nextStreak === 3 ? 20 : 0

                  setCheckedIn(true)
                  setStreak(nextStreak)
                  setPoints(points + 10 + bonus)
                  setBonusMessage(
                    nextStreak === 7
                      ? '脂 7譌･騾｣邯壹・繝ｼ繝翫せ +50pt・・
                      : nextStreak === 3
                        ? '脂 3譌･騾｣邯壹・繝ｼ繝翫せ +20pt・・
                        : ''
                  )
                }}>
                  繝・う繝ｪ繝ｼ繝√ぉ繝・け繧､繝ｳ
                </button>
              )}
            </li>
          </ul>
          <div className="seeker-bonus">
            <h3>導 Seeker Exclusive Mission</h3>
            <p>繧ｦ繧ｩ繝ｬ繝・ヨ謗･邯壹・鄂ｲ蜷阪・繝・う繝ｪ繝ｼ繝√ぉ繝・け繧､繝ｳ螳御ｺ・〒縲ヾKR菫晄怏驥上↓蠢懊§縺ｦ繝懊・繝翫せ</p>
            <p>1 SKR莉･荳・ +25pt</p>
            <p>100 SKR莉･荳・ +50pt</p>
            <p>1000 SKR莉･荳・ +100pt</p>
            <button onClick={checkSkrBalance}>
              SKR谿矩ｫ倥ｒ遒ｺ隱・            </button>
            {skrError && <p>笞・・{skrError}</p>}

            {skrChecked && (
              <p>
                SKR谿矩ｫ・ {effectiveSkrBalance} SKR
                <br />
                <span className={`skr-rank ${skrRank.toLowerCase()}`}>
                  SKR Rank: {skrRank}
                </span>
              </p>
            )}
            {seekerAccount && signatureStatus && checkedIn && skrChecked && effectiveSkrBalance > 0 ? (
              seekerBonusClaimed ? (
                <p>笨・Seeker Bonus 迯ｲ蠕玲ｸ医∩ +{skrReward}pt</p>
              ) : (
                <button
                  onClick={() => {
                    setPoints(points + skrReward)
                    setSeekerBonusClaimed(true)
                    localStorage.setItem(
                      'seekerBonusClaimDate',
                      new Date().toLocaleDateString('sv-SE')
                    )
                  }}
                >
                  Claim +{skrReward}pt
                </button>
              )
            ) : (
              !seekerAccount || !signatureStatus || !checkedIn ? (
                <p>白 3縺､縺ｮ繝溘ャ繧ｷ繝ｧ繝ｳ繧貞ｮ御ｺ・☆繧九→繧｢繝ｳ繝ｭ繝・け</p>
              ) : !skrChecked ? (
                <p>博 縺ｾ縺售KR谿矩ｫ倥ｒ遒ｺ隱阪＠縺ｦ縺上□縺輔＞</p>
              ) : (
                <p>白 SKR菫晄怏閠・剞螳壹Α繝・す繝ｧ繝ｳ縺ｧ縺・/p>
              )
            )}
          </div>
          <p>迴ｾ蝨ｨ繝昴う繝ｳ繝・ {points}</p>
          <p>櫨 騾｣邯壹メ繧ｧ繝・け繧､繝ｳ: {streak}譌･</p>
          <p>氏 3譌･騾｣邯壹〒+20pt / 7譌･騾｣邯壹〒+50pt</p>
          <p>氏 Reward Shop・・00pt縺ｧ髯仙ｮ壹ヰ繝・ず繧偵い繝ｳ繝ｭ繝・け</p>
          <button onClick={() => {
            setPoints(points - 100)
            setRewardUnlocked(true)
            localStorage.setItem('seekerRewardUnlocked', 'true')
          }}
            disabled={points < 100 || rewardUnlocked}>
            {rewardUnlocked ? '醇 髯仙ｮ壹ヰ繝・ず迯ｲ蠕玲ｸ医∩' : points >= 100 ? '100pt縺ｧ繧｢繝ｳ繝ｭ繝・け' : `縺ゅ→${100 - points}pt`}
          </button>
          {bonusMessage && <p>{bonusMessage}</p>}
          <p>醇 Achievements: {achievements.filter(a => a.unlocked).map(a => a.title).join(' / ')}</p>
        </div>
      )}
      {connected && publicKey && (
        <>
          <p>
            Wallet: {publicKey.toBase58()}          </p>

          {error ? (
            <p>Devnet error: {error}</p>
          ) : (
            <p>
              Devnet balance:{' '}
              {balance === null ? 'Loading...' : `${balance} SOL`}
            </p>
          )}
        </>
      )}
    </div>
  )
}

function App() {
  const endpoint = 'https://api.devnet.solana.com'

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <div>
            <h1>SEEKER MISSION</h1>
            <p>Complete daily missions. Build your streak. Earn points. 噫</p>
            <WalletInfo />
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default App
