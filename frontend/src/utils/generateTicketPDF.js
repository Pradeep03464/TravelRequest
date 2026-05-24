import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateTicketPDF = async (request) => {
    const element = document.createElement('div');
    element.style.padding = '40px';
    element.style.width = '800px';
    element.style.background = '#ffffff';
    element.style.fontFamily = "'Inter', sans-serif";
    element.style.position = 'absolute';
    element.style.left = '-9999px';

    element.innerHTML = `
        <div style="border: 2px solid #e2e8f0; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #008cff 0%, #0056b3 100%); padding: 30px; color: white;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h1 style="margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -1px;">Travel Request</h1>
                        <p style="margin: 5px 0 0; opacity: 0.8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Boarding Pass & E-Ticket</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 0; font-size: 10px; font-weight: 900; opacity: 0.6; text-transform: uppercase;">Reference PNR</p>
                        <p style="margin: 0; font-size: 24px; font-weight: 900; font-family: monospace;">${request.pnr || 'N/A'}</p>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px; background: white;">
                <!-- Passenger Info -->
                <div style="display: flex; gap: 40px; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 1px dashed #e2e8f0;">
                    <div style="flex: 1;">
                        <p style="margin: 0 0 5px; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase;">Passenger Name</p>
                        <p style="margin: 0; font-size: 18px; font-weight: 800; color: #1e293b;">${request.employee?.name || 'N/A'}</p>
                    </div>
                    <div style="flex: 1;">
                        <p style="margin: 0 0 5px; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase;">Employee ID</p>
                        <p style="margin: 0; font-size: 18px; font-weight: 800; color: #1e293b;">#${request.employee?.id || 'N/A'}</p>
                    </div>
                    <div style="flex: 1;">
                        <p style="margin: 0 0 5px; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase;">Class</p>
                        <p style="margin: 0; font-size: 18px; font-weight: 800; color: #1e293b;">Economy Corporate</p>
                    </div>
                </div>

                <!-- Journey Grid -->
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 40px; margin-bottom: 40px;">
                    <div style="flex: 1;">
                        <p style="margin: 0 0 5px; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase;">From</p>
                        <p style="margin: 0; font-size: 28px; font-weight: 900; color: #1e293b;">${request.fromLocation}</p>
                    </div>
                    <div style="flex: 1; text-align: center; position: relative;">
                        <div style="height: 2px; background: #e2e8f0; width: 100%; position: absolute; top: 50%; left: 0; z-index: 1;"></div>
                        <div style="background: white; position: relative; z-index: 2; display: inline-block; padding: 0 15px;">
                            <span style="font-size: 20px;">✈️</span>
                        </div>
                    </div>
                    <div style="flex: 1; text-align: right;">
                        <p style="margin: 0 0 5px; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase;">To</p>
                        <p style="margin: 0; font-size: 28px; font-weight: 900; color: #008cff;">${request.toLocation}</p>
                    </div>
                </div>

                <!-- Footer Details -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; background: #f8fafc; padding: 25px; border-radius: 16px;">
                    <div>
                        <p style="margin: 0 0 5px; font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase;">Departure</p>
                        <p style="margin: 0; font-size: 14px; font-weight: 800; color: #1e293b;">${new Date(request.departureDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p style="margin: 0 0 5px; font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase;">Travel Mode</p>
                        <p style="margin: 0; font-size: 14px; font-weight: 800; color: #1e293b;">${request.travelMode}</p>
                    </div>
                    <div>
                        <p style="margin: 0 0 5px; font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase;">Agency</p>
                        <p style="margin: 0; font-size: 14px; font-weight: 800; color: #1e293b;">${request.agency || 'Vistara Corporate'}</p>
                    </div>
                    <div>
                        <p style="margin: 0 0 5px; font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase;">Ticket Cost</p>
                        <p style="margin: 0; font-size: 14px; font-weight: 800; color: #059669;">₹${request.cost}</p>
                    </div>
                </div>

                <div style="margin-top: 30px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; gap: 5px;">
                       ${Array(12).fill(0).map(() => `<div style="width: 2px; height: 30px; background: #cbd5e1;"></div>`).join('')}
                       ${Array(5).fill(0).map(() => `<div style="width: 4px; height: 30px; background: #1e293b;"></div>`).join('')}
                       ${Array(8).fill(0).map(() => `<div style="width: 2px; height: 30px; background: #cbd5e1;"></div>`).join('')}
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 0; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Authorized By</p>
                        <p style="margin: 0; font-size: 12px; font-weight: 700; color: #64748b;">Travel Request Enterprise System</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(element);

    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: null
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
    pdf.save(`Ticket_${request.pnr || request.id}.pdf`);

    document.body.removeChild(element);
};
