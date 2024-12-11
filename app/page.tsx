import { GetSheetData, SheetData } from "./actions";
import HomePageClient from "./page.client";

export default function Home() {
    return (
        <div>
            <HomePageServer />
        </div>
    )
}

async function HomePageServer() {
    const sheetData: SheetData = await GetSheetData()
    return <HomePageClient sheetData={sheetData} />
}