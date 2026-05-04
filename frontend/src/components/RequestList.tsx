import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import type { Address } from 'viem'
import { CONTRACT_ADDRESS, CHARITY_ABI } from '../contract'
import { RequestCard } from './RequestCard'

const ZERO_ADDR = '0x0000000000000000000000000000000000000000' as const

export function RequestList() {
  const { address, isConnected } = useAccount()

  const { data: countData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHARITY_ABI,
    functionName: 'getRequestsCount',
  })

  const { data: totalDonors } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHARITY_ABI,
    functionName: 'totalDonors',
  })

  const { data: manager } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHARITY_ABI,
    functionName: 'manager',
  })

  const { data: myDonation } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CHARITY_ABI,
    functionName: 'donations',
    args: [address ?? ZERO_ADDR],
    query: { enabled: isConnected },
  })

  const count = Number(countData ?? 0n)

  const { data: requestsData } = useReadContracts({
    contracts: Array.from({ length: count }, (_, i) => ({
      address: CONTRACT_ADDRESS as Address,
      abi: CHARITY_ABI,
      functionName: 'getRequest' as const,
      args: [BigInt(i)] as const,
    })),
    query: { enabled: count > 0 },
  })

  const isManager = isConnected && !!manager && address?.toLowerCase() === manager.toLowerCase()
  const isDonor = isConnected && myDonation !== undefined && myDonation > 0n
  const donors = totalDonors ?? 0n

  return (
    <section>
      <div className="section-header">
        <h2 className="section-title">
          📜 Harcama Talepleri
          {count > 0 && <span className="count-badge">{count}</span>}
        </h2>
      </div>

      {count === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>Henüz harcama talebi oluşturulmamış.</p>
        </div>
      ) : (
        <div className="requests-list">
          {requestsData?.map((item, i) => {
            if (item.status !== 'success' || !item.result) return null
            const [description, vendor, amount, votes, completed] = item.result as [
              string, Address, bigint, bigint, boolean
            ]
            return (
              <RequestCard
                key={i}
                requestId={i}
                description={description}
                vendor={vendor}
                amount={amount}
                votes={votes}
                completed={completed}
                totalDonors={donors}
                isManager={isManager}
                isDonor={isDonor}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
