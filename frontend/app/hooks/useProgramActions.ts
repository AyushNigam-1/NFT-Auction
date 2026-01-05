// import { Metaplex, PublicKey } from "@metaplex-foundation/js"
// import { useProgram } from "./useProgram"

// const useProgramActions = () => {
//     const { connection } = useProgram()

//     async function fetchNFTs(owner: PublicKey) {
//         const metaplex = Metaplex.make(connection)

//         // Fetch all NFTs owned by the wallet
//         const nfts = await metaplex.nfts().findAllByOwner({
//             owner
//         })

//         // Optional: load full metadata (slower but complete)
//         const fullNFTs = await Promise.all(
//             nfts.map(nft =>
//                 metaplex.nfts().load({ metadata: nft })
//             )
//         )

//         return fullNFTs
//     }
// }