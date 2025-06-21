
import jsPDF from 'jspdf';
import { formatCurrency } from './currency';

export interface ContractData {
  lenderName: string;
  lenderAddress: string;
  borrowerName: string;
  borrowerAddress: string;
  amount: number;
  interestRate: number;
  durationMonths: number;
  purpose: string;
  startDate: Date;
  endDate: Date;
  monthlyPayment: number;
  totalRepayment: number;
  walletAddress?: string;
  contractHash?: string;
}

export const generateLoanContract = (data: ContractData): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPosition = 30;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('LOAN AGREEMENT CONTRACT', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 20;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Contract Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
  
  if (data.contractHash) {
    yPosition += 10;
    doc.setFontSize(10);
    doc.text(`Smart Contract Hash: ${data.contractHash}`, pageWidth / 2, yPosition, { align: 'center' });
  }

  yPosition += 30;

  // Parties section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PARTIES TO THE AGREEMENT', margin, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('LENDER:', margin, yPosition);
  yPosition += 8;
  doc.text(`Name: ${data.lenderName}`, margin + 10, yPosition);
  yPosition += 8;
  doc.text(`Address: ${data.lenderAddress}`, margin + 10, yPosition);
  if (data.walletAddress) {
    yPosition += 8;
    doc.text(`Wallet Address: ${data.walletAddress}`, margin + 10, yPosition);
  }

  yPosition += 15;
  doc.text('BORROWER:', margin, yPosition);
  yPosition += 8;
  doc.text(`Name: ${data.borrowerName}`, margin + 10, yPosition);
  yPosition += 8;
  doc.text(`Address: ${data.borrowerAddress}`, margin + 10, yPosition);

  yPosition += 25;

  // Loan terms section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('LOAN TERMS AND CONDITIONS', margin, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const terms = [
    `Principal Amount: ${formatCurrency(data.amount)}`,
    `Interest Rate: ${data.interestRate}% per annum`,
    `Loan Duration: ${data.durationMonths} months`,
    `Purpose: ${data.purpose}`,
    `Start Date: ${data.startDate.toLocaleDateString()}`,
    `End Date: ${data.endDate.toLocaleDateString()}`,
    `Monthly Payment: ${formatCurrency(data.monthlyPayment)}`,
    `Total Repayment: ${formatCurrency(data.totalRepayment)}`
  ];

  terms.forEach(term => {
    doc.text(`• ${term}`, margin + 10, yPosition);
    yPosition += 10;
  });

  yPosition += 20;

  // Legal clauses
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TERMS AND CONDITIONS', margin, yPosition);
  yPosition += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const clauses = [
    '1. REPAYMENT: The Borrower agrees to repay the loan in equal monthly installments as specified above.',
    '2. DEFAULT: If any payment is more than 30 days late, the entire loan balance becomes immediately due.',
    '3. EARLY PAYMENT: The Borrower may prepay the loan in full or in part at any time without penalty.',
    '4. GOVERNING LAW: This agreement shall be governed by the laws of the jurisdiction where it is executed.',
    '5. SMART CONTRACT: If applicable, this agreement is secured by a blockchain smart contract for automated execution.',
    '6. DISPUTE RESOLUTION: Any disputes arising from this agreement shall be resolved through binding arbitration.',
    '7. ENTIRE AGREEMENT: This contract represents the complete agreement between the parties.'
  ];

  clauses.forEach(clause => {
    const lines = doc.splitTextToSize(clause, pageWidth - 2 * margin);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * 5 + 5;
  });

  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 30;
  }

  yPosition += 20;

  // Signature section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SIGNATURES', margin, yPosition);
  yPosition += 30;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  // Lender signature
  doc.text('LENDER:', margin, yPosition);
  yPosition += 20;
  doc.line(margin, yPosition, margin + 80, yPosition);
  yPosition += 8;
  doc.text('Signature', margin, yPosition);
  yPosition += 15;
  doc.text(`Print Name: ${data.lenderName}`, margin, yPosition);
  yPosition += 15;
  doc.text('Date: _______________', margin, yPosition);

  // Borrower signature
  yPosition -= 50;
  const rightMargin = pageWidth - margin - 80;
  doc.text('BORROWER:', rightMargin, yPosition);
  yPosition += 20;
  doc.line(rightMargin, yPosition, rightMargin + 80, yPosition);
  yPosition += 8;
  doc.text('Signature', rightMargin, yPosition);
  yPosition += 15;
  doc.text(`Print Name: ${data.borrowerName}`, rightMargin, yPosition);
  yPosition += 15;
  doc.text('Date: _______________', rightMargin, yPosition);

  return doc;
};

export const downloadContract = (contractData: ContractData) => {
  const pdf = generateLoanContract(contractData);
  const fileName = `loan_contract_${contractData.borrowerName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};
