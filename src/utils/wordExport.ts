import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun, AlignmentType, BorderStyle, ImageRun } from 'docx';

interface SubjectResult {
  name: string;
  ca1: number;
  ca2: number;
  exam: number;
  total: number;
  rank: number;
  grade?: string;
  remark?: string;
}

interface PupilData {
  id: string;
  name: string;
  registrationNumber?: string;
  sex?: string;
  subjects: SubjectResult[];
}

interface ExportOptions {
  className: string;
  schoolName?: string;
  schoolLogo?: string; // Base64 encoded image
  term?: string;
  academicYear?: string;
  classTeacher?: string;
  headOfSchool?: string;
  totalStudentsInClass?: number;
  classAverage?: number;
}

const calculateGrade = (total: number): string => {
  if (total >= 70) return 'A';
  if (total >= 60) return 'B';
  if (total >= 50) return 'C';
  if (total >= 45) return 'D';
  if (total >= 40) return 'E';
  return 'F';
};

export const exportPupilResult = async (
  pupil: PupilData,
  options: ExportOptions
) => {
  try {
    const children: any[] = [];

    // Calculate student average
    const studentAverage = pupil.subjects.length > 0
      ? (pupil.subjects.reduce((sum, s) => sum + s.total, 0) / pupil.subjects.length).toFixed(2)
      : '0';

    // ============ HEADER SECTION ============
    // Create header with logo on right and school name on left (same line)
    // School name and logo in a table for layout
    // Define bold border style for header and info tables
    const boldBorder = {
      style: BorderStyle.SINGLE,
      size: 24,  // 3pt (bold)
      color: '000000'
    };
    
    const boldBorders = {
      top: boldBorder,
      bottom: boldBorder,
      left: boldBorder,
      right: boldBorder,
      insideHorizontal: boldBorder,
      insideVertical: boldBorder
    };

    const headerTable = new Table({
      rows: [
        new TableRow({
          children: [
            // Left cell: School name
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: boldBorders,
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: options.schoolName || 'SCHOOL NAME', size: 52, bold: true })],
                  alignment: AlignmentType.LEFT
                })
              ]
            }),
            // Right cell: Logo
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: boldBorders,
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: options.schoolLogo
                ? [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new ImageRun({
                          data: options.schoolLogo.replace(/^data:image\/\w+;base64,/, ''),
                          transformation: { width: 100, height: 100 },
                          type: 'png'
                        })
                      ]
                    })
                  ]
                : [new Paragraph({ text: '' })]
            })
          ]
        })
      ],
      width: { size: 100, type: WidthType.PERCENTAGE }
    });

    children.push(headerTable);
    
    // Two lines of vertical spacing
    children.push(new Paragraph(''));
    children.push(new Paragraph(''));

    // ============ STUDENT & CLASS INFORMATION SECTION ============
    // Create info section with two columns
    const infoTable = new Table({
      rows: [
        new TableRow({
          children: [
            // Left column: Student info
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: boldBorders,
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: `Name: ${pupil.name}`, bold: true, size: 24 })],
                  alignment: AlignmentType.LEFT
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Registration Number: ${pupil.registrationNumber || 'N/A'}`, bold: true, size: 24 })],
                  alignment: AlignmentType.LEFT
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Sex: ${pupil.sex || 'N/A'}`, bold: true, size: 24 })],
                  alignment: AlignmentType.LEFT
                })
              ]
            }),
            // Right column: Class info
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: boldBorders,
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: `Class: ${options.className || ''}`, bold: true, size: 24 })],
                  alignment: AlignmentType.RIGHT
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Number of Students in Class: ${(options.totalStudentsInClass || 0).toString()}`, bold: true, size: 24 })],
                  alignment: AlignmentType.RIGHT
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Overall Class Average: ${options.classAverage ? options.classAverage.toFixed(2) : 'N/A'}`, bold: true, size: 24 })],
                  alignment: AlignmentType.RIGHT
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Student Average: ${studentAverage}`, bold: true, size: 24 })],
                  alignment: AlignmentType.RIGHT
                })
              ]
            })
          ]
        })
      ],
      width: { size: 100, type: WidthType.PERCENTAGE }
    });

    children.push(infoTable);
    children.push(new Paragraph(''));

    // ============ RESULTS TABLE ============
    const resultRows = [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'D3D3D3' },
            children: [new Paragraph({ children: [new TextRun({ text: 'Subject', bold: true, size: 20 })] })]
          }),
          new TableCell({
            shading: { fill: 'D3D3D3' },
            children: [new Paragraph({ children: [new TextRun({ text: 'CA1 (20)', bold: true, size: 20 })] })]
          }),
          new TableCell({
            shading: { fill: 'D3D3D3' },
            children: [new Paragraph({ children: [new TextRun({ text: 'CA2 (20)', bold: true, size: 20 })] })]
          }),
          new TableCell({
            shading: { fill: 'D3D3D3' },
            children: [new Paragraph({ children: [new TextRun({ text: 'Exam (60)', bold: true, size: 20 })] })]
          }),
          new TableCell({
            shading: { fill: 'D3D3D3' },
            children: [new Paragraph({ children: [new TextRun({ text: 'Total', bold: true, size: 20 })] })]
          }),
          new TableCell({
            shading: { fill: 'D3D3D3' },
            children: [new Paragraph({ children: [new TextRun({ text: 'Grade', bold: true, size: 20 })] })]
          }),
          new TableCell({
            shading: { fill: 'D3D3D3' },
            children: [new Paragraph({ children: [new TextRun({ text: 'Position', bold: true, size: 20 })] })]
          }),
          new TableCell({
            shading: { fill: 'D3D3D3' },
            children: [new Paragraph({ children: [new TextRun({ text: 'Remark', bold: true, size: 20 })] })]
          })
        ]
      })
    ];

    // Add subject rows
    pupil.subjects.forEach(subject => {
      const grade = calculateGrade(subject.total);
      resultRows.push(
        new TableRow({
          children: [
            new TableCell({ 
              children: [new Paragraph({ children: [new TextRun({ text: subject.name, size: 20 })] })] 
            }),
            new TableCell({ 
              children: [new Paragraph({ children: [new TextRun({ text: subject.ca1.toString(), size: 20 })] })] 
            }),
            new TableCell({ 
              children: [new Paragraph({ children: [new TextRun({ text: subject.ca2.toString(), size: 20 })] })] 
            }),
            new TableCell({ 
              children: [new Paragraph({ children: [new TextRun({ text: subject.exam.toString(), size: 20 })] })] 
            }),
            new TableCell({ 
              children: [new Paragraph({ children: [new TextRun({ text: subject.total.toString(), bold: true, size: 20 })] })] 
            }),
            new TableCell({ 
              children: [new Paragraph({ children: [new TextRun({ text: grade, bold: true, size: 20 })] })] 
            }),
            new TableCell({ 
              children: [new Paragraph({ children: [new TextRun({ text: subject.rank.toString(), size: 20 })] })] 
            }),
            new TableCell({ 
              children: [new Paragraph({ children: [new TextRun({ text: subject.remark || '-', size: 20 })] })] 
            })
          ]
        })
      );
    });

    children.push(new Table({ rows: resultRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
    children.push(new Paragraph(''));

    // ============ COMMENTS & SIGNATURE SECTION ============
    children.push(
      new Paragraph({ children: [new TextRun({ text: 'Teacher\'s Comment:', bold: true, size: 24 })] }),
      new Paragraph('_'.repeat(80)),
      new Paragraph('_'.repeat(80)),
      new Paragraph('_'.repeat(80)),
      new Paragraph('')
    );

    // Signature section
    children.push(
      new Paragraph('Class Teacher Signature: ________________     Date: ___________'),
      new Paragraph(''),
      new Paragraph('Head of School Signature: ________________     Date: ___________')
    );

    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pupil.name.replace(/\s+/g, '_')}_Results.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting result:', error);
    throw error;
  }
};
