import { GetSheet2Data, GetSheetData, SheetData } from "./actions";
import HomePageClient from "./page.client";

export default function Home() {
    return (
        <div>
            <HomePageServer />
        </div>
    )
}

async function HomePageServer() {
    const sheetData1: SheetData = await GetSheetData()
    const sheetData2: SheetData = await GetSheet2Data()
    return <HomePageClient sheetData1={sheetData1} sheetData2={sheetData2} />
}