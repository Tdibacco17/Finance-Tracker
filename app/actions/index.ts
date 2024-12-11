'use server'
import { sheets } from '@/lib/sheets';
import { revalidatePath } from 'next/cache';

export type SheetRow = string[]; // Cada fila es un array de strings
export type SheetData = SheetRow[]; // La respuesta es un array de filas
export type ApiResponse = { success: boolean, message: string }

type Compra = {
    ticker: string;
    cantidad: string;
    fechaDeCompra: string;
    precioCompra: string;
    precioActual: string;
    totalCompra: string;
    totalActual: string;
    gananciaPerdidaDolares: string;
    gananciaPerdidaPorcentaje: string;
};

export const GetSheetData = async (): Promise<SheetData> => {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const range = 'sheet1!A:Z';

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });

    const rows = response.data.values || [];

    const filteredData = rows.filter(row => row.some(cell => cell.trim() !== ''));

    return filteredData;
}

export const AddDataToSheet = async (ticker: string, cantidad: string, fecha: string, precioCompra: string): Promise<ApiResponse> => {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;  // ID de la hoja de cálculo
    const range = 'sheet1!A:E';  // Rango que incluye las columnas A a E

    // Crear la nueva fila con los datos de ticker, cantidad, fecha y las fórmulas dinámicas
    const newRow = [
        [
            ticker,  // Ticker ingresado
            cantidad,  // Cantidad ingresada
            fecha,  // Fecha ingresada
            precioCompra, // Precio compra,
            `=GOOGLEFINANCE("${ticker}";"price")`,  // Fórmula de precio actual
            `=("${precioCompra}")*${cantidad}`,  // Total de la compra = Precio Compra * Cantidad
            `=GOOGLEFINANCE("${ticker}";"price")*${cantidad}`,  // Total actual = Precio Actual * Cantidad
            `=GOOGLEFINANCE("${ticker}";"price")*${cantidad}-"${precioCompra}"*${cantidad}`,  // Ganancia/Pérdida en pesos = Total actual - Total compra
            `=GOOGLEFINANCE("${ticker}";"price")*${cantidad}/(("${precioCompra}")*${cantidad})-1`,
        ],
    ];

    try {
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',  // Usamos 'USER_ENTERED' para que Sheets ejecute la fórmula
            requestBody: {
                values: newRow,  // Los datos que agregamos
            },
        });
        console.log('Datos agregados exitosamente:', response.data);
        revalidatePath('/')
        return { success: true, message: 'Datos agregados correctamente' };
    } catch (error) {
        console.error('Error al agregar datos:', error);
        return { success: false, message: 'Error al agregar datos' };
    }
};


export const DeleteRowFromSheet = async (rowIndex: number): Promise<ApiResponse> => {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;  // ID de la hoja de cálculo

    // Crear la solicitud para eliminar la fila
    const request = {
        requests: [
            {
                deleteDimension: {
                    range: {
                        sheetId: 0,  // El ID de la hoja (si es la primera hoja, generalmente es 0)
                        dimension: 'ROWS',
                        startIndex: rowIndex - 1,  // El índice de la fila (0-based, por eso restamos 1)
                        endIndex: rowIndex,  // Solo eliminamos una fila, así que el rango es el mismo
                    },
                },
            },
        ],
    };

    try {
        const response = await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: request,
        });
        console.log('Fila eliminada exitosamente:', response.data);
        revalidatePath('/')
        return { success: true, message: 'Fila eliminada correctamente' };
    } catch (error) {
        console.error('Error al eliminar fila:', error);
        return { success: false, message: 'Error al eliminar fila' };
    }
};

