'use client'
import { useState } from 'react';
import { AddDataToSheet, ApiResponse, SheetData, SheetRow } from './actions';
// DeleteRowFromSheet,

export default function HomePageClient({ sheetData1, sheetData2 }: { sheetData1: SheetData, sheetData2: SheetData }) {
    const [ticker, setTicker] = useState('');
    const [cantidad, setCantidad] = useState('');
    const [fecha, setFecha] = useState('');
    const [precioCompra, setPrecioCompra] = useState('');

    // Manejador de envío del formulario
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        // // Hacer la llamada a la API para agregar los datos al sheet
        const response: ApiResponse = await AddDataToSheet(ticker.trim(), cantidad, fecha, precioCompra);

        if (response.success) {
            alert('Datos agregados correctamente');
        } else {
            alert('Hubo un error al agregar los datos');
        }
    };

    // const handleDeleteRow = async (index: number) => {
    //     const response = await DeleteRowFromSheet(index + 1); // +1 porque el índice de Google Sheets es 1-based

    //     if (response.success) {
    //         alert('Fila eliminada correctamente');
    //     } else {
    //         alert('Hubo un error al eliminar la fila');
    //     }
    // };

    return (
        <div>

            <div className="flex flex-col gap-12">
                <div className='flex flex-col gap-2'>
                    <p>Historial de compras</p>
                    {sheetData1?.length !== 0 && sheetData1.map((sheetRowData: SheetRow, index: number) => {
                        return (
                            <div className="flex gap-2|" key={`${ticker}-${index}`}>
                                {sheetRowData.map((rowData: string, secondIndex: number) => {
                                    return (
                                        <div className="flex gap-4" key={`row-${index}-cell-${secondIndex}`}>
                                            <p className="w-40">
                                                {rowData}
                                            </p>
                                        </div>
                                    );
                                })}
                                {/* {index > 0 && <button
                                className="bg-red-500/30 text-white p-2"
                                onClick={() => handleDeleteRow(index)}
                            >
                                Eliminar
                            </button>} */}
                            </div>
                        )
                    })}
                </div>
                <div className='flex flex-col gap-4'>
                    <p>Portafolio</p>
                    {sheetData2?.length !== 0 && sheetData2.map((sheetRowData: SheetRow, index: number) => {
                        return (
                            <div className="flex gap-4" key={`${ticker}-${index}`}>
                                {sheetRowData.map((rowData: string, secondIndex: number) => {
                                    return (
                                        <div className="flex gap-4" key={`row-${index}-cell-${secondIndex}`}>
                                            <p className="w-40">
                                                {rowData}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="flex justify-center items-center min-h-screen">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Ticker"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value.toUpperCase())}
                        required
                        className="p-2 border text-black"
                    />
                    <input
                        type="number"
                        placeholder="Precio de compra: 6329.00"
                        value={precioCompra}
                        onChange={(e) => setPrecioCompra(e.target.value)}
                        required
                        className="p-2 border text-black"
                    />
                    <input
                        type="number"
                        placeholder="Cantidad"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        required
                        className="p-2 border text-black"
                    />
                    <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        required
                        className="p-2 border text-black"
                    />
                    <button type="submit" className="bg-blue-500 text-white p-2">
                        Agregar Datos
                    </button>
                </form>
            </div>
        </div>
    );
}
