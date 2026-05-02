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
  observations?: { [key: string]: number };
  daysSchoolOpened?: number;
  daysInAttendance?: number;
  nextTermBegins?: string;
  classTeacherComment?: string;
  headTeacherComment?: string;
}

interface ExportOptions {
  className: string;
  schoolName?: string;
  schoolAddress?: string;
  schoolLogo?: string; // Base64 encoded image
  reportSheetTitle?: string; // Title like "BASIC PRIMARY 2025/26 2nd TERM REPORT SHEET"
  term?: string;
  academicYear?: string;
  classTeacher?: string;
  headOfSchool?: string;
  totalStudentsInClass?: number;
  classAverage?: number;
  daysSchoolOpened?: number;
  daysInAttendance?: number;
  nextTermBegins?: string;
}

const isScoreEntered = (ca1: number, ca2: number, exam: number): boolean => {
  return ca1 > 0 || ca2 > 0 || exam > 0;
};

const calculateGrade = (total: number, ca1: number, ca2: number, exam: number): string => {
  if (!isScoreEntered(ca1, ca2, exam)) return '-';
  if (total >= 70) return 'A';
  if (total >= 60) return 'B';
  if (total >= 50) return 'C';
  if (total >= 45) return 'D';
  if (total >= 40) return 'E';
  return 'F';
};

const calculateRemark = (total: number, ca1: number, ca2: number, exam: number): string => {
  if (!isScoreEntered(ca1, ca2, exam)) return '-';
  const grade = calculateGrade(total, ca1, ca2, exam);
  switch (grade) {
    case 'A':
      return 'Exceptional';
    case 'B':
      return 'Very good';
    case 'C':
      return 'Good';
    case 'D':
      return 'Satisfactory';
    case 'E':
      return 'Needs improvement';
    case 'F':
      return 'Unsatisfactory';
    default:
      return '-';
  }
};

const ATTRIBUTES = {
  Classroom: ['Punctuality', 'Attendance', 'Participation', 'Attitude to work', 'Attentiveness', 'Assignments', 'Handwriting'],
  Psychological: ['Emotional stability', 'Initiative/Creativity', 'Self-Control', 'Sense of Responsibility', 'Relationship with Students', 'Relationship with Staff', 'Leadership Trait'],
  Social: ['Neatness', 'Politeness', 'Honesty', 'Verbal Fluency'],
  Physical: ['Physical Health', 'Games & Sports', 'Dexterity']
};

export const exportPupilResult = async (
  pupil: PupilData,
  options: ExportOptions
) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children: any[] = [];

    // Calculate student average
    const studentAverage = pupil.subjects.length > 0
      ? (pupil.subjects.reduce((sum, s) => sum + s.total, 0) / pupil.subjects.length).toFixed(2)
      : '0';

    // ============ HEADER SECTION ============
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

    // Nested table for logo and school name side-by-side (no borders)
    const noBorder = {
      top: { style: BorderStyle.NONE, size: 0 },
      bottom: { style: BorderStyle.NONE, size: 0 },
      left: { style: BorderStyle.NONE, size: 0 },
      right: { style: BorderStyle.NONE, size: 0 },
      insideHorizontal: { style: BorderStyle.NONE, size: 0 },
      insideVertical: { style: BorderStyle.NONE, size: 0 }
    };

    const logoNameTable = new Table({
      rows: [
        new TableRow({
          children: [
            // Logo cell
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              borders: noBorder,
              margins: { top: 0, bottom: 0, left: 0, right: 20 },
              children: [
                new Paragraph({
                  children: options.schoolLogo
                    ? [
                        new ImageRun({
                          data: options.schoolLogo.replace(/^data:image\/\w+;base64,/, ''),
                          transformation: { width: 70, height: 70 },
                          type: 'png'
                        })
                      ]
                    : [],
                  alignment: AlignmentType.LEFT,
                  spacing: { after: 0 }
                })
              ]
            }),
            // School name cell
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              borders: noBorder,
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: options.schoolName || 'SCHOOL NAME', size: 44, bold: true })],
                  alignment: AlignmentType.LEFT,
                  spacing: { after: 0 }
                })
              ]
            })
          ]
        })
      ],
      width: { size: 100, type: WidthType.PERCENTAGE }
    });

    const headerTable = new Table({
      rows: [
        new TableRow({
          children: [
            // Left cell: Logo, school name (nested table) and address
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: boldBorders,
              margins: { top: 60, bottom: 60, left: 80, right: 80 },
              children: [
                // Nested table with logo and school name
                logoNameTable,
                // Address paragraph
                new Paragraph({
                  children: [new TextRun({ text: options.schoolAddress || 'School Address', size: 18 })],
                  alignment: AlignmentType.LEFT,
                  spacing: { before: 40 }
                })
              ]
            }),
            // Right cell: Report sheet title
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: boldBorders,
              margins: { top: 60, bottom: 60, left: 80, right: 80 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: options.reportSheetTitle || 'REPORT SHEET', size: 44, bold: true, color: '000000' })],
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 100, after: 100 }
                })
              ]
            })
          ]
        })
      ],
      width: { size: 100, type: WidthType.PERCENTAGE }
    });

    children.push(headerTable);
    
    // One line of vertical spacing
    children.push(new Paragraph(''));

    // ============ STUDENT & CLASS INFORMATION SECTION ============
    // Create info section with two columns
    const infoTable = new Table({
      rows: [
        new TableRow({
          children: [
            // Left column: Student info
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              borders: boldBorders,
              margins: { top: 60, bottom: 60, left: 80, right: 80 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: `Name: ${pupil.name}`, bold: true, size: 18 })],
                  alignment: AlignmentType.LEFT
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Registration Number: ${pupil.registrationNumber || 'N/A'}`, bold: true, size: 18 })],
                  alignment: AlignmentType.LEFT
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Sex: ${pupil.sex || 'N/A'}`, bold: true, size: 18 })],
                  alignment: AlignmentType.LEFT
                })
              ]
            }),
            // Right column: Class info
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              borders: boldBorders,
              margins: { top: 60, bottom: 60, left: 80, right: 80 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: `Class: ${options.className || ''}`, bold: true, size: 18 })],
                  alignment: AlignmentType.RIGHT
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Number of Students in Class: ${(options.totalStudentsInClass || 0).toString()}`, bold: true, size: 18 })],
                  alignment: AlignmentType.RIGHT
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Overall Class Average: ${options.classAverage ? options.classAverage.toFixed(2) : 'N/A'}`, bold: true, size: 18 })],
                  alignment: AlignmentType.RIGHT
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Student Average: ${studentAverage}`, bold: true, size: 18 })],
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
        height: { value: 200, rule: 'atLeast' },
        children: [
          new TableCell({
            shading: { fill: '1F4E78' },
            margins: { top: 40, bottom: 40, left: 60, right: 60 },
            children: [new Paragraph({ children: [new TextRun({ text: 'Subject', bold: true, size: 16, color: 'FFFFFF' })] })]
          }),
          new TableCell({
            shading: { fill: '1F4E78' },
            margins: { top: 40, bottom: 40, left: 60, right: 60 },
            children: [new Paragraph({ children: [new TextRun({ text: 'Max CA', bold: true, size: 16, color: 'FFFFFF' })] })]
          }),
          new TableCell({
            shading: { fill: '1F4E78' },
            margins: { top: 40, bottom: 40, left: 60, right: 60 },
            children: [new Paragraph({ children: [new TextRun({ text: 'CA1', bold: true, size: 16, color: 'FFFFFF' })] })]
          }),
          new TableCell({
            shading: { fill: '1F4E78' },
            margins: { top: 40, bottom: 40, left: 60, right: 60 },
            children: [new Paragraph({ children: [new TextRun({ text: 'CA2', bold: true, size: 16, color: 'FFFFFF' })] })]
          }),
          new TableCell({
            shading: { fill: '1F4E78' },
            margins: { top: 40, bottom: 40, left: 60, right: 60 },
            children: [new Paragraph({ children: [new TextRun({ text: 'Max Exam', bold: true, size: 16, color: 'FFFFFF' })] })]
          }),
          new TableCell({
            shading: { fill: '1F4E78' },
            margins: { top: 40, bottom: 40, left: 60, right: 60 },
            children: [new Paragraph({ children: [new TextRun({ text: 'Exam', bold: true, size: 16, color: 'FFFFFF' })] })]
          }),
          new TableCell({
            shading: { fill: '1F4E78' },
            margins: { top: 40, bottom: 40, left: 60, right: 60 },
            children: [new Paragraph({ children: [new TextRun({ text: 'Total', bold: true, size: 16, color: 'FFFFFF' })] })]
          }),
          new TableCell({
            shading: { fill: '1F4E78' },
            margins: { top: 40, bottom: 40, left: 60, right: 60 },
            children: [new Paragraph({ children: [new TextRun({ text: 'Grade', bold: true, size: 16, color: 'FFFFFF' })] })]
          }),
          new TableCell({
            shading: { fill: '1F4E78' },
            margins: { top: 40, bottom: 40, left: 60, right: 60 },
            children: [new Paragraph({ children: [new TextRun({ text: 'Rank', bold: true, size: 16, color: 'FFFFFF' })] })]
          }),
          new TableCell({
            shading: { fill: '1F4E78' },
            margins: { top: 40, bottom: 40, left: 60, right: 60 },
            children: [new Paragraph({ children: [new TextRun({ text: 'Remark', bold: true, size: 16, color: 'FFFFFF' })] })]
          })
        ]
      })
    ];

    // Add subject rows with alternating colors
    pupil.subjects.forEach((subject, index) => {
      const hasScore = isScoreEntered(subject.ca1, subject.ca2, subject.exam);
      const grade = calculateGrade(subject.total, subject.ca1, subject.ca2, subject.exam);
      const remark = calculateRemark(subject.total, subject.ca1, subject.ca2, subject.exam);
      
      // Determine row background color (alternating)
      const rowBgColor = index % 2 === 0 ? 'FFFFFF' : 'E7F0F7';
      
      // Determine grade background color
      let gradeBgColor = 'FFFFFF';
      let gradeTextColor = '000000';
      switch(grade) {
        case 'A':
          gradeBgColor = '70AD47';
          gradeTextColor = 'FFFFFF';
          break;
        case 'B':
          gradeBgColor = '4472C4';
          gradeTextColor = 'FFFFFF';
          break;
        case 'C':
          gradeBgColor = 'FFC000';
          gradeTextColor = '000000';
          break;
        case 'D':
          gradeBgColor = 'FF9800';
          gradeTextColor = 'FFFFFF';
          break;
        case 'E':
        case 'F':
          gradeBgColor = 'E74C3C';
          gradeTextColor = 'FFFFFF';
          break;
        default:
          gradeBgColor = 'FFFFFF';
          gradeTextColor = '000000';
      }
      
      resultRows.push(
        new TableRow({
          height: { value: 280, rule: 'atLeast' },
          children: [
            new TableCell({ 
              shading: { fill: rowBgColor },
              margins: { top: 60, bottom: 60, left: 60, right: 60 },
              children: [new Paragraph({ children: [new TextRun({ text: subject.name, size: 16 })] })] 
            }),
            new TableCell({ 
              shading: { fill: rowBgColor },
              margins: { top: 60, bottom: 60, left: 60, right: 60 },
              children: [new Paragraph({ children: [new TextRun({ text: '20', bold: true, size: 16 })] })] 
            }),
            new TableCell({ 
              shading: { fill: rowBgColor },
              margins: { top: 60, bottom: 60, left: 60, right: 60 },
              children: [new Paragraph({ children: [new TextRun({ text: subject.ca1 === 0 ? '-' : subject.ca1.toString(), size: 16 })] })] 
            }),
            new TableCell({ 
              shading: { fill: rowBgColor },
              margins: { top: 60, bottom: 60, left: 60, right: 60 },
              children: [new Paragraph({ children: [new TextRun({ text: subject.ca2 === 0 ? '-' : subject.ca2.toString(), size: 16 })] })] 
            }),
            new TableCell({ 
              shading: { fill: rowBgColor },
              margins: { top: 60, bottom: 60, left: 60, right: 60 },
              children: [new Paragraph({ children: [new TextRun({ text: '60', bold: true, size: 16 })] })] 
            }),
            new TableCell({ 
              shading: { fill: rowBgColor },
              margins: { top: 60, bottom: 60, left: 60, right: 60 },
              children: [new Paragraph({ children: [new TextRun({ text: subject.exam === 0 ? '-' : subject.exam.toString(), size: 16 })] })] 
            }),
            new TableCell({ 
              shading: { fill: rowBgColor },
              margins: { top: 60, bottom: 60, left: 60, right: 60 },
              children: [new Paragraph({ children: [new TextRun({ text: hasScore ? subject.total.toString() : '-', bold: true, size: 16 })] })] 
            }),
            new TableCell({ 
              shading: { fill: gradeBgColor },
              margins: { top: 60, bottom: 60, left: 60, right: 60 },
              children: [new Paragraph({ children: [new TextRun({ text: grade, bold: true, size: 16, color: gradeTextColor })] })] 
            }),
            new TableCell({ 
              shading: { fill: rowBgColor },
              margins: { top: 60, bottom: 60, left: 60, right: 60 },
              children: [new Paragraph({ children: [new TextRun({ text: hasScore ? (subject.rank ? subject.rank.toString() : '-') : '-', size: 16 })] })] 
            }),
            new TableCell({ 
              shading: { fill: rowBgColor },
              margins: { top: 60, bottom: 60, left: 60, right: 60 },
              children: [new Paragraph({ children: [new TextRun({ text: remark, size: 16 })] })] 
            })
          ]
        })
      );
    });

    // Borders for result table - remove horizontal lines
    const resultTableBorders = {
      top: { style: BorderStyle.SINGLE, size: 24, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 24, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 24, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 24, color: '000000' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0 },
      insideVertical: { style: BorderStyle.SINGLE, size: 24, color: '000000' }
    };

    children.push(new Table({ 
      rows: resultRows, 
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: resultTableBorders
    }));
    children.push(new Paragraph(''));

    // ============ AFFECTIVE & PSYCHOMOTOR OBSERVATIONS ============
    if (pupil.observations && Object.keys(pupil.observations).length > 0) {
      children.push(
        new Paragraph({ children: [new TextRun({ text: 'Affective & Psychomotor Observations', bold: true, size: 28 })] }),
        new Paragraph('(Behavioral & Physical Abilities)'),
        new Paragraph('')
      );

      // Create side-by-side observations table with all 4 categories
      const observationRows: TableRow[] = [];
      const categories = Object.entries(ATTRIBUTES);
      
      // Add header row with category names
      const headerCells: TableCell[] = [];
      categories.forEach(([category]) => {
        headerCells.push(
          new TableCell({
            shading: { fill: '70AD47' },
            margins: { top: 100, bottom: 100, left: 80, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: category, bold: true, size: 18, color: 'FFFFFF' })] })]
          })
        );
        headerCells.push(
          new TableCell({
            shading: { fill: '70AD47' },
            margins: { top: 100, bottom: 100, left: 80, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: 'Rating', bold: true, size: 18, color: 'FFFFFF' })] })]
          })
        );
      });
      observationRows.push(new TableRow({ children: headerCells }));

      // Determine max attributes count
      const maxAttributes = Math.max(...categories.map(([_, attrs]) => attrs.length));

      // Add attribute rows
      for (let i = 0; i < maxAttributes; i++) {
        const rowCells: TableCell[] = [];
        const rowBgColor = i % 2 === 0 ? 'FFFFFF' : 'E8F4E8';
        
        categories.forEach(([_, attributes]) => {
          const attribute = attributes[i];
          const ratingValue = attribute ? (pupil.observations?.[attribute] || 0) : 0;
          
          // Attribute cell
          rowCells.push(
            new TableCell({
              shading: { fill: rowBgColor },
              margins: { top: 80, bottom: 80, left: 80, right: 80 },
              children: [new Paragraph({ children: [new TextRun({ text: attribute || '', size: 16 })] })]
            })
          );

          // Rating cell (use number only)
          rowCells.push(
            new TableCell({
              shading: { fill: rowBgColor },
              margins: { top: 80, bottom: 80, left: 80, right: 80 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: ratingValue ? ratingValue.toString() : '-', size: 16, bold: true })]
                })
              ]
            })
          );
        });
        
        observationRows.push(new TableRow({ children: rowCells }));
      }

      children.push(new Table({ rows: observationRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
      children.push(new Paragraph(''));

      // Add legend
      children.push(
        new Paragraph({ children: [new TextRun({ text: 'Rating Scale: 5 = Excellent | 4 = Very good | 3 = Good | 2 = Weak | 1 = Can do better', size: 18 })] })
      );
      children.push(new Paragraph(''));
    }

    // ============ ATTENDANCE & SIGNATURE SECTION ============
    children.push(new Paragraph({ children: [new TextRun({ text: 'Attendance & Signature Information', bold: true, size: 28, color: '1F4E78' })] }));
    children.push(new Paragraph(''));
    
    const attendanceRows: TableRow[] = [
      new TableRow({
        height: { value: 200, rule: 'atLeast' },
        children: [
          new TableCell({
            shading: { fill: 'DCE6F1' },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: 'No. of days school was opened:', bold: true, size: 18 })] })]
          }),
          new TableCell({
            shading: { fill: 'FFFFFF' },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: options.daysSchoolOpened?.toString() || '', size: 18 })] })]
          }),
          new TableCell({
            shading: { fill: 'DCE6F1' },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: 'No. of days in attendance:', bold: true, size: 18 })] })]
          }),
          new TableCell({
            shading: { fill: 'FFFFFF' },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: options.daysInAttendance?.toString() || '', size: 18 })] })]
          })
        ]
      }),
      new TableRow({
        height: { value: 200, rule: 'atLeast' },
        children: [
          new TableCell({
            shading: { fill: 'DCE6F1' },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: 'Next term begins on:', bold: true, size: 18 })] })]
          }),
          new TableCell({
            shading: { fill: 'FFFFFF' },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: options.nextTermBegins || '', size: 18 })] })]
          }),
          new TableCell({
            shading: { fill: 'DCE6F1' },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph('')]
          }),
          new TableCell({
            shading: { fill: 'FFFFFF' },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph('')]
          })
        ]
      }),
      new TableRow({
        height: { value: 200, rule: 'atLeast' },
        children: [
          new TableCell({
            shading: { fill: 'DCE6F1' },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: 'Class Teacher:', bold: true, size: 18 })] })]
          }),
          new TableCell({
            shading: { fill: 'FFFFFF' },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: options.classTeacher || '', size: 18, bold: true })] })]
          }),
          new TableCell({
            shading: { fill: 'DCE6F1' },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: 'Comment:', bold: true, size: 18 })] })]
          }),
          new TableCell({
            shading: { fill: 'FFFFFF' },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: pupil.classTeacherComment || '', size: 18 })] })]
          })
        ]
      }),
      new TableRow({
        height: { value: 200, rule: 'atLeast' },
        children: [
          new TableCell({
            shading: { fill: 'DCE6F1' },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: 'Head Teacher:', bold: true, size: 18 })] })]
          }),
          new TableCell({
            shading: { fill: 'FFFFFF' },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: options.headOfSchool || '', size: 18, bold: true })] })]
          }),
          new TableCell({
            shading: { fill: 'DCE6F1' },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: 'Comment:', bold: true, size: 18 })] })]
          }),
          new TableCell({
            shading: { fill: 'FFFFFF' },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: pupil.headTeacherComment || '', size: 18 })] })]
          })
        ]
      })
    ];
    children.push(new Table({ rows: attendanceRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
    children.push(new Paragraph(''));

    const doc = new Document({ 
      sections: [{ 
        children,
        properties: {
          page: {
            margin: {
              top: 360,     // 0.5 inch
              bottom: 360,  // 0.5 inch
              left: 360,    // 0.5 inch
              right: 360    // 0.5 inch
            }
          }
        }
      }] 
    });
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
