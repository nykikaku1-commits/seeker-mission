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
        setError('Seeker Connectが見つかりません')
        return
      }

      console.log("CONNECT START", wallet.features[StandardConnect])
      const { accounts } = await wallet.features[StandardConnect].connect()
      console.log("CONNECT RESULT:", accounts)
      if (!accounts?.[0]) {
        setError('ウォレット接続に失敗しました')
        return
      }
      setSeekerAddress(accounts[0].address)
      setSeekerAccount(accounts[0])
      setError('')
    } catch (err) {
      setError(err?.message || 'Seeker Connectへの接続に失敗しました')
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
  const achievements = [{ id: 'first-checkin', title: '🚀 First Check-in', unlocked: checkedIn }, { id: 'three-day-streak', title: '🔥 3 Day Streak', unlocked: effectiveStreak >= 3 }, { id: 'seven-day-streak', title: '🔥 7 Day Streak', unlocked: effectiveStreak >= 7 }, { id: 'skr-silver', title: '🥈 SKR Silver', unlocked: skrSilverUnlocked }]

  const skrRank =
    effectiveSkrBalance >= 1000 ? 'Gold' :
      effectiveSkrBalance >= 100 ? 'Silver' :
        effectiveSkrBalance >= 1 ? 'Bronze' :
          'Locked'
  const signTestMessage = async () => {
    try {
      if (!seekerAccount) {
        setSignatureStatus('先にConnect with Seekerしてください')
        return
      }

      setSignatureStatus('署名を準備中...')

      const wallet = getWallets()
        .get()
        .find((w) => w.name === 'Seeker Connect')

      const feature = wallet?.features['solana:signMessage']

      if (!feature) {
        throw new Error('Seeker Connectが署名に対応していません')
      }

      const message = new TextEncoder().encode('SEEKER BUILDER sign test')

      await feature.signMessage({
        account: seekerAccount,
        message,
      })

      setSignatureStatus('署名成功！')
    } catch (err) {
      setSignatureStatus(err?.message || '署名に失敗しました')
    }
  }
  const checkSkrBalance = async () => {
    if (!seekerAccount) {
      setSkrError('ウォレットを接続してください')
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
      setSkrError(err?.message || 'SKR残高を確認できませんでした')
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
          <h3>🏆 SEEKER PROFILE</h3>
          <p>Wallet: {seekerAddress.slice(0, 4)}...{seekerAddress.slice(-4)}</p>
          <p>⭐ Points: {points}</p>
          <p>🔥 Streak: {streak} days</p>
          <p>🎖 Badge: {rewardUnlocked ? 'LIMITED HOLDER' : 'Locked'}</p>
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
            <li>✅ ウォレット接続</li>
            <li>✅ メッセージ署名</li>
            <li>
              {checkedIn ? (
                '✅ デイリーチェックイン完了'
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
                      ? '🎉 7日連続ボーナス +50pt！'
                      : nextStreak === 3
                        ? '🎉 3日連続ボーナス +20pt！'
                        : ''
                  )
                }}>
                  デイリーチェックイン
                </button>
              )}
            </li>
          </ul>
          <div className="seeker-bonus">
            <h3>📱 Seeker Exclusive Mission</h3>
            <p>ウォレット接続・署名・デイリーチェックイン完了で、SKR保有量に応じてボーナス</p>
            <p>1 SKR以上: +25pt</p>
            <p>100 SKR以上: +50pt</p>
            <p>1000 SKR以上: +100pt</p>
            <button onClick={checkSkrBalance}>
              SKR残高を確認
            </button>
            {skrError && <p>⚠️ {skrError}</p>}

            {skrChecked && (
              <p>
                SKR残高: {effectiveSkrBalance} SKR
                <br />
                <span className={`skr-rank ${skrRank.toLowerCase()}`}>
                  SKR Rank: {skrRank}
                </span>
              </p>
            )}
            {seekerAccount && signatureStatus && checkedIn && skrChecked && effectiveSkrBalance > 0 ? (
              seekerBonusClaimed ? (
                <p>✅ Seeker Bonus 獲得済み +{skrReward}pt</p>
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
                <p>🔒 3つのミッションを完了するとアンロック</p>
              ) : !skrChecked ? (
                <p>🔎 まずSKR残高を確認してください</p>
              ) : (
                <p>🔒 SKR保有者限定ミッションです</p>
              )
            )}
          </div>
          <p>現在ポイント: {points}</p>
          <p>🔥 連続チェックイン: {streak}日</p>
          <p>🎁 3日連続で+20pt / 7日連続で+50pt</p>
          <p>🎁 Reward Shop：100ptで限定バッジをアンロック</p>
          <button onClick={() => {
            setPoints(points - 100)
            setRewardUnlocked(true)
            localStorage.setItem('seekerRewardUnlocked', 'true')
          }}
            disabled={points < 100 || rewardUnlocked}>
            {rewardUnlocked ? '🏆 限定バッジ獲得済み' : points >= 100 ? '100ptでアンロック' : `あと${100 - points}pt`}
          </button>
          {bonusMessage && <p>{bonusMessage}</p>}
          <p>🏆 Achievements: {achievements.filter(a => a.unlocked).map(a => a.title).join(' / ')}</p>
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
            <p>Complete daily missions. Build your streak. Earn points. 🚀</p>
            <WalletInfo />
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default App