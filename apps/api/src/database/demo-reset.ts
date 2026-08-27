import "dotenv/config";
import { pool } from "./pool.js";
import { hashPassword } from "../security/crypto.js";

const expectedConfirmation = "RESET_LOCAL_MMSC_DEMO";
const database = new URL(
  process.env.DATABASE_URL ??
    "postgresql://mmsc:mmsc_dev_password@localhost:15432/mmsc",
);
const demoPassword = process.env.MMSC_DEMO_PASSWORD;
if (
  (process.env.NODE_ENV ?? "development") === "production" ||
  !["localhost", "127.0.0.1", "postgres"].includes(database.hostname) ||
  !["/mmsc", "/mmsc_phase19_validation"].includes(database.pathname)
)
  throw new Error("Demo reset is restricted to the local MMSC database");
if (process.env.MMSC_DEMO_RESET !== expectedConfirmation)
  throw new Error(
    `Set MMSC_DEMO_RESET=${expectedConfirmation} to authorize the local destructive reset`,
  );
if (!demoPassword || demoPassword.length < 12)
  throw new Error(
    "Set MMSC_DEMO_PASSWORD to a local-only password with at least 12 characters",
  );

const client = await pool.connect();
const one = async (sql: string, values: unknown[] = []) => {
  const result = await client.query(sql, values);
  if (!result.rows[0])
    throw new Error(`Expected a row from ${sql.slice(0, 60)}`);
  return result.rows[0] as Record<string, string>;
};
const must = <T>(value: T | undefined): T => {
  if (value === undefined)
    throw new Error("Demo seed source data is incomplete");
  return value;
};
const key = (rows: Record<string, string>[]) =>
  Object.fromEntries(rows.map((row) => [row.code, row.id])) as Record<
    string,
    string
  >;
const first = [
  "Amihan",
  "Bayani",
  "Cielo",
  "Dalisay",
  "Elian",
  "Felicity",
  "Gino",
  "Hiraya",
  "Inigo",
  "Jasmin",
  "Kian",
  "Ligaya",
  "Marikit",
  "Nicanor",
  "Ophelia",
  "Paolo",
  "Queenie",
  "Rafael",
  "Samira",
  "Tomas",
  "Victoria",
  "Xandra",
  "Yani",
  "Zia",
];
const last = [
  "Santos",
  "Reyes",
  "Mendoza",
  "Navarro",
  "Bautista",
  "Castillo",
  "Villanueva",
  "Dela Cruz",
  "Garcia",
  "Aquino",
  "Ramos",
  "Tolentino",
  "Mercado",
  "Salazar",
  "Soriano",
  "Valdez",
];

try {
  await client.query("BEGIN");
  const admins = await client.query(
    `SELECT DISTINCT u.id,u.display_name FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE r.code='super_administrator' AND u.status='active' AND u.archived_at IS NULL`,
  );
  if (admins.rowCount !== 1)
    throw new Error(
      `Expected exactly one retained active Super Administrator; found ${admins.rowCount}`,
    );
  const adminId = String(admins.rows[0].id);
  await client.query(
    `TRUNCATE notifications,attendance_terminals,admission_applications,gradebooks,student_attendance_records,employee_attendance_records,teaching_assignments,subject_grade_level_assignments,teacher_profiles,enrollments,student_guardians,guardians,students,employees,positions,employee_types,calendar_events,academic_statuses,sections,classrooms,subjects,grade_levels,departments,academic_terms,grading_periods,school_years,external_schools RESTART IDENTITY CASCADE`,
  );
  await client.query(`UPDATE login_identities SET active=false,updated_at=now() WHERE user_id<>$1`, [adminId]);
  await client.query(`DELETE FROM auth_sessions WHERE user_id<>$1`, [adminId]);
  await client.query(`DELETE FROM user_roles WHERE user_id<>$1`, [adminId]);
  await client.query(`UPDATE users SET status='inactive',archived_at=COALESCE(archived_at,now()),updated_at=now(),version=version+1 WHERE id<>$1`, [adminId]);
  await client.query(
    `DELETE FROM user_roles WHERE user_id=$1 AND role_id NOT IN(SELECT id FROM roles WHERE code='super_administrator')`,
    [adminId],
  );
  const school = await one(
    `SELECT id FROM schools WHERE is_primary AND active AND archived_at IS NULL`,
  );
  const campus = await one(
    `SELECT id FROM campuses WHERE school_id=$1 AND code='MAIN' AND archived_at IS NULL`,
    [school.id],
  );
  const year = await one(
    `INSERT INTO school_years(school_id,name,starts_on,ends_on,status)VALUES($1,'SY 2026-2027','2026-06-15','2027-04-16','active')RETURNING id`,
    [school.id],
  );
  const terms = [];
  for (const [i, value] of [
    ["Q1", "First Quarter", "2026-06-15", "2026-08-21"],
    ["Q2", "Second Quarter", "2026-08-24", "2026-10-30"],
    ["Q3", "Third Quarter", "2026-11-09", "2027-01-29"],
    ["Q4", "Fourth Quarter", "2027-02-01", "2027-04-16"],
  ].entries())
    terms.push(
      await one(
        `INSERT INTO academic_terms(school_year_id,code,name,sequence,starts_on,ends_on,status)VALUES($1,$2,$3,$4,$5,$6,$7)RETURNING id,code`,
        [
          year.id,
          ...value.slice(0, 2),
          i + 1,
          ...value.slice(2),
          i === 0 ? "active" : "planned",
        ],
      ),
    );
  const departmentRows = [];
  for (const row of [
    ["ECE", "Early Childhood", "academic"],
    ["ELEM", "Elementary", "academic"],
    ["JHS", "Junior High School", "academic"],
    ["SHS", "Senior High School", "academic"],
    ["ACAD", "Academic Affairs", "administrative"],
    ["REG", "Admissions / Registrar", "administrative"],
    ["GUIDE", "Guidance", "support"],
    ["LIB", "Library", "support"],
    ["CLINIC", "Clinic / Health Services", "support"],
    ["IT", "Information Technology", "support"],
    ["FIN", "Finance / Accounting", "administrative"],
    ["HR", "Human Resources", "administrative"],
    ["ADMIN", "Administration", "administrative"],
    ["FAC", "Facilities / Maintenance", "support"],
    ["SEC", "Security", "support"],
    ["CAN", "Canteen / Cafeteria", "support"],
  ])
    departmentRows.push(
      await one(
        `INSERT INTO departments(school_id,campus_id,code,name,category)VALUES($1,$2,$3,$4,$5)RETURNING id,code`,
        [school.id, campus.id, ...row],
      ),
    );
  const departments = key(departmentRows);
  const gradeRows = [];
  const grades = [
    ["PREP", "Prep", "early_childhood"],
    ["KINDER", "Kindergarten", "early_childhood"],
    ...Array.from({ length: 12 }, (_, i) => [
      `G${i + 1}`,
      `Grade ${i + 1}`,
      i < 6 ? "elementary" : i < 10 ? "junior_high" : "senior_high",
    ]),
  ];
  for (const [i, row] of grades.entries())
    gradeRows.push(
      await one(
        `INSERT INTO grade_levels(school_id,code,name,sequence,education_stage)VALUES($1,$2,$3,$4,$5)RETURNING id,code,name`,
        [school.id, row[0], row[1], i + 1, row[2]],
      ),
    );
  const rooms = [];
  for (let i = 1; i <= 20; i++)
    rooms.push(
      await one(
        `INSERT INTO classrooms(campus_id,code,name,building,floor,capacity)VALUES($1,$2,$3,$4,$5,35)RETURNING id`,
        [
          campus.id,
          `ROOM-${String(i).padStart(2, "0")}`,
          i <= 2
            ? `Preschool Room ${i}`
            : i === 17
              ? "Science Laboratory"
              : i === 18
                ? "Computer Laboratory 1"
                : i === 19
                  ? "Library"
                  : "Multipurpose Room",
          "Academic Building",
          String(Math.ceil(i / 5)),
        ],
      ),
    );
  const sections = [];
  for (const grade of gradeRows)
    for (const [i, saint] of ["St. Matthew", "St. Mark"].entries())
      sections.push(
        await one(
          `INSERT INTO sections(school_year_id,grade_level_id,campus_id,code,name,capacity)VALUES($1,$2,$3,$4,$5,35)RETURNING id,grade_level_id`,
          [
            year.id,
            grade.id,
            campus.id,
            `${grade.code}-${i + 1}`,
            `${grade.name} – ${saint}`,
          ],
        ),
      );
  const subjectRows = [];
  for (const row of [
    ["ENG", "English"],
    ["FIL", "Filipino"],
    ["MATH", "Mathematics"],
    ["SCI", "Science"],
    ["AP", "Araling Panlipunan"],
    ["VALUES", "Values Education"],
    ["MAPEH", "MAPEH"],
    ["ICT", "Computer / ICT"],
    ["TLE", "Technology and Livelihood Education"],
    ["ORAL", "Oral Communication"],
    ["RW", "Reading and Writing"],
    ["GENMATH", "General Mathematics"],
    ["STAT", "Statistics and Probability"],
    ["ELS", "Earth and Life Science"],
    ["MIL", "Media and Information Literacy"],
    ["PR", "Practical Research"],
    ["ET", "Empowerment Technologies"],
    ["ENTREP", "Entrepreneurship"],
    ["IMMERSION", "Work Immersion"],
    ["BIO", "General Biology"],
    ["CHEM", "General Chemistry"],
    ["PHYS", "General Physics"],
    ["PRECAL", "Pre-Calculus"],
    ["FABM", "Fundamentals of Accountancy, Business and Management"],
  ])
    subjectRows.push(
      await one(
        `INSERT INTO subjects(school_id,department_id,code,name,description)VALUES($1,$2,$3,$4,'Philippine K-12 demo curriculum')RETURNING id,code`,
        [
          school.id,
          departments[must(row[0]).length > 4 ? "SHS" : "ACAD"],
          ...row,
        ],
      ),
    );
  for (const entity of ["student", "enrollment", "term", "section"])
    for (const [i, status] of ["ACTIVE", "INACTIVE", "COMPLETED"].entries())
      await client.query(
        `INSERT INTO academic_statuses(school_id,entity_type,code,label,display_order,is_terminal)VALUES($1,$2,$3,$4,$5,$6)`,
        [
          school.id,
          entity,
          status,
          must(status[0]) + status.slice(1).toLowerCase(),
          i + 1,
          i > 0,
        ],
      );
  for (const [title, type, date] of [
    ["Opening of Classes", "academic", "2026-06-15"],
    ["Parent Orientation", "community", "2026-06-20"],
    ["First Quarter Examination", "academic", "2026-08-17"],
    ["Second Quarter Examination", "academic", "2026-10-26"],
    ["Christmas Break", "holiday", "2026-12-19"],
    ["Third Quarter Examination", "academic", "2027-01-25"],
    ["Foundation Day", "community", "2027-02-12"],
    ["Final Examination", "academic", "2027-04-05"],
    ["Recognition Day", "community", "2027-04-14"],
    ["Graduation and Moving-Up", "academic", "2027-04-16"],
  ])
    await client.query(
      `INSERT INTO calendar_events(school_id,campus_id,school_year_id,title,event_type,starts_at,ends_at,all_day,location,status)VALUES($1,$2,$3,$4,$5,$6::date,$6::date,true,'MMSC Main Campus','published')`,
      [school.id, campus.id, year.id, title, type, date],
    );
  const external = [];
  for (const row of [
    ["Cavite Learning Center", "Private", "General Trias"],
    ["Bayani Public Elementary School", "Public", "Imus"],
    ["South Cavite National High School", "Public", "Dasmarinas"],
    ["St. Martha Academy", "Private", "Trece Martires"],
    ["Hope Integrated School", "Private", "Bacoor"],
  ])
    external.push(
      await one(
        `INSERT INTO external_schools(name,school_type,education_level,city_municipality,province)VALUES($1,$2,'Basic Education',$3,'Cavite')RETURNING id,name`,
        row,
      ),
    );
  const employeeTypes = [];
  for (const row of [
    ["REG", "Regular"],
    ["PROB", "Probationary"],
    ["PART", "Part-time"],
  ])
    employeeTypes.push(
      await one(
        `INSERT INTO employee_types(school_id,code,name)VALUES($1,$2,$3)RETURNING id,code`,
        [school.id, ...row],
      ),
    );
  const types = key(employeeTypes);
  const positions = [];
  for (const [i, name] of [
    "School Administrator",
    "Principal",
    "Registrar",
    "Admissions Officer",
    "HR Officer",
    "Finance Officer",
    "Guidance Counselor",
    "Librarian",
    "Clinic Nurse",
    "IT Administrator",
    "Teacher",
  ].entries())
    positions.push(
      await one(
        `INSERT INTO positions(school_id,department_id,code,name)VALUES($1,$2,$3,$4)RETURNING id,code`,
        [
          school.id,
          departments[
            i < 2
              ? "ADMIN"
              : i < 4
                ? "REG"
                : i === 4
                  ? "HR"
                  : i === 5
                    ? "FIN"
                    : i === 6
                      ? "GUIDE"
                      : i === 7
                        ? "LIB"
                        : i === 8
                          ? "CLINIC"
                          : i === 9
                            ? "IT"
                            : "ACAD"
          ],
          `P${i + 1}`,
          name,
        ],
      ),
    );
  const position = key(positions);
  const employees = [];
  for (let i = 0; i < 30; i++) {
    const teacher = i >= 10,
      fname = first[i % first.length],
      lname = last[(i * 3) % last.length];
    employees.push(
      await one(
        `INSERT INTO employees(school_id,campus_id,department_id,position_id,employee_type_id,employee_number,first_name,last_name,birth_date,gender,work_email,mobile_phone,address_line1,barangay,city,province,hire_date,employment_status,remarks)VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'Demo residence','San Francisco','General Trias','Cavite',$13,'active','Local MVP demo employee')RETURNING id,employee_number,first_name,last_name`,
        [
          school.id,
          campus.id,
          departments[
            teacher
              ? i < 16
                ? "ELEM"
                : i < 23
                  ? "JHS"
                  : "SHS"
              : i < 2
                ? "ADMIN"
                : i < 4
                  ? "REG"
                  : i === 4
                    ? "HR"
                    : i === 5
                      ? "FIN"
                      : i === 6
                        ? "GUIDE"
                        : i === 7
                          ? "LIB"
                          : i === 8
                            ? "CLINIC"
                            : "IT"
          ],
          position[teacher ? "P11" : `P${Math.min(i + 1, 10)}`],
          types[teacher && i % 5 === 0 ? "PART" : "REG"],
          `MMSC-EMP-${String(i + 1).padStart(4, "0")}`,
          fname,
          lname,
          `19${75 + (i % 20)}-0${(i % 9) + 1}-15`,
          i % 2 ? "female" : "male",
          `${fname}.${lname}@mmsc.demo.invalid`
            .toLowerCase()
            .replaceAll(" ", "-"),
          `0917000${String(i).padStart(4, "0")}`,
          `20${15 + (i % 9)}-06-01`,
        ],
      ),
    );
  }
  const teachers = [];
  for (let i = 10; i < 30; i++)
    teachers.push(
      await one(
        `INSERT INTO teacher_profiles(employee_id,teacher_number,faculty_status,department_id,teaching_level,biography)VALUES($1,$2,'full_time',$3,$4,'Fictitious MMSC demo faculty')RETURNING id`,
        [
          must(employees[i]).id,
          `MMSC-TCH-${String(i - 9).padStart(3, "0")}`,
          departments[i < 16 ? "ELEM" : i < 23 ? "JHS" : "SHS"],
          i < 16 ? "Elementary" : i < 23 ? "Junior High" : "Senior High",
        ],
      ),
    );
  for (const [i, teacher] of teachers.entries())
    await client.query(
      `INSERT INTO teacher_school_year_assignments(teacher_profile_id,school_year_id,department_id,faculty_status,teaching_level,advisory_section_id,homeroom_section_id,maximum_load_units)VALUES($1,$2,$3,'full_time',$4,$5,$5,30)`,
      [
        teacher.id,
        year.id,
        departments[i < 6 ? "ELEM" : i < 13 ? "JHS" : "SHS"],
        i < 6 ? "Elementary" : i < 13 ? "Junior High" : "Senior High",
        must(sections[i]).id,
      ],
    );
  const teacherYears = (
    await client.query(
      `SELECT id FROM teacher_school_year_assignments ORDER BY created_at`,
    )
  ).rows as Record<string, string>[];
  let offeringIndex = 0;
  for (const [gradeIndex, grade] of gradeRows.entries()) {
    const selected =
      gradeIndex < 10
        ? subjectRows.slice(0, gradeIndex < 6 ? 8 : 9)
        : subjectRows.slice(9);
    for (const subject of selected) {
      const offering = await one(
        `INSERT INTO subject_grade_level_assignments(school_year_id,grade_level_id,subject_id,load_units,required)VALUES($1,$2,$3,1,true)RETURNING id`,
        [year.id, grade.id, subject.id],
      );
      for (const section of sections.filter(
        (item) => item.grade_level_id === grade.id,
      ))
        await client.query(
          `INSERT INTO teaching_assignments(subject_grade_level_assignment_id,section_id,teacher_school_year_assignment_id,role)VALUES($1,$2,$3,'primary')`,
          [
            offering.id,
            section.id,
            must(teacherYears[offeringIndex % teacherYears.length]).id,
          ],
        );
      offeringIndex++;
    }
  }
  const guardians = [];
  const students = [];
  const enrollments = [];
  for (const [sectionIndex, section] of sections.entries())
    for (let n = 0; n < 7; n++) {
      const index = sectionIndex * 7 + n,
        lname = last[(index * 5) % last.length];
      if (n % 2 === 0)
        guardians.push(
          await one(
            `INSERT INTO guardians(school_id,first_name,last_name,email,mobile_phone,address_line1,barangay,city,province,occupation,employer,notes)VALUES($1,$2,$3,$4,$5,'Demo residence','San Francisco','General Trias','Cavite','Private employee','Demo employer','Local MVP demo guardian')RETURNING id,guardian_number,first_name,last_name`,
            [
              school.id,
              first[(index + 7) % first.length],
              lname,
              `family.${sectionIndex}.${n}@demo.invalid`,
              `092000${String(index).padStart(5, "0")}`,
            ],
          ),
        );
      const guardian = guardians.at(-1)!;
      const externalSchool = must(external[index % external.length]);
      const student = await one(
        `INSERT INTO students(school_id,student_number,first_name,last_name,birth_date,gender,address_line1,barangay,city,province,enrollment_status,entry_date,previous_school_id,previous_school,notes)VALUES($1,$2,$3,$4,$5,$6,'Demo residence','San Francisco','General Trias','Cavite','enrolled','2026-05-15',$7,$8,'Local MVP demo student')RETURNING id,student_number,first_name,last_name`,
        [
          school.id,
          `MMSC-2026-${String(index + 1).padStart(4, "0")}`,
          first[index % first.length],
          lname,
          `${2012 - Math.floor(sectionIndex / 2)}-0${(n % 9) + 1}-12`,
          n % 2 ? "female" : "male",
          externalSchool.id,
          externalSchool.name,
        ],
      );
      students.push(student);
      await client.query(
        `INSERT INTO student_guardians(student_id,guardian_id,relationship_type,is_primary,has_legal_custody,receives_communications)VALUES($1,$2,$3,true,true,true)`,
        [student.id, guardian.id, n % 2 ? "father" : "mother"],
      );
      enrollments.push(
        await one(
          `INSERT INTO enrollments(student_id,school_year_id,grade_level_id,section_id,status,enrollment_date,remarks)VALUES($1,$2,$3,$4,'enrolled','2026-05-15','MVP demo enrollment')RETURNING id`,
          [student.id, year.id, section.grade_level_id, section.id],
        ),
      );
    }
  const admissionStatuses = [
    "draft",
    "submitted",
    "under_review",
    "information_requested",
    "approved",
    "rejected",
    "withdrawn",
  ];
  for (let i = 0; i < 24; i++) {
    const status = must(admissionStatuses[i % admissionStatuses.length]),
      grade = must(gradeRows[i % gradeRows.length]),
      source = must(external[i % external.length]);
    const application = await one(
      `INSERT INTO admission_applications(school_id,application_type,school_year_id,grade_level_id,status,first_name,last_name,birth_date,gender,mobile_phone,city,province,previous_school_id,previous_school,applicant_notes,information_request,decision_reason,submitted_at,decided_at,created_by,updated_by)VALUES($1,'new_student',$2,$3,$4,$5,$6,$7,$8,$9,'General Trias','Cavite',$10,$11,'Realistic local demo applicant',$12,$13,$14,$15,$16,$16)RETURNING id`,
      [
        school.id,
        year.id,
        grade.id,
        status,
        first[(i + 3) % first.length],
        last[(i + 4) % last.length],
        `2014-0${(i % 9) + 1}-10`,
        i % 2 ? "female" : "male",
        `093000${String(i).padStart(5, "0")}`,
        source.id,
        source.name,
        status === "information_requested"
          ? "Please submit the latest report card."
          : null,
        ["approved", "rejected"].includes(status)
          ? `Application ${status}`
          : null,
        status === "draft" ? null : "2026-08-10",
        ["approved", "rejected"].includes(status) ? "2026-08-15" : null,
        adminId,
      ],
    );
    await client.query(
      `INSERT INTO admission_guardians(application_id,first_name,last_name,relationship_type,email,mobile_phone,is_primary)VALUES($1,$2,$3,'mother',$4,$5,true)`,
      [
        application.id,
        first[(i + 8) % first.length],
        last[(i + 4) % last.length],
        `applicant.${i}@demo.invalid`,
        `094000${String(i).padStart(5, "0")}`,
      ],
    );
    for (const [d, document] of [
      "PSA Birth Certificate",
      "Report Card",
      "Good Moral Certificate",
    ].entries())
      await client.query(
        `INSERT INTO admission_documents(application_id,document_type,display_name,storage_key,original_filename,mime_type,size_bytes,status,notes,verified_by,verified_at)VALUES($1,$2,$2,$3,$4,'application/pdf',1024,$5,'Metadata-only local demo requirement',$6,$7)`,
        [
          application.id,
          document,
          `demo/admissions/${application.id}/requirement-${d + 1}.pdf`,
          `demo-requirement-${d + 1}.pdf`,
          d < i % 4 ? "verified" : d === i % 4 ? "received" : "pending",
          d < i % 4 ? adminId : null,
          d < i % 4 ? "2026-08-12" : null,
        ],
      );
    await client.query(
      `INSERT INTO admission_status_history(application_id,to_status,reason,actor_user_id)VALUES($1,$2,'Seeded demo workflow state',$3)`,
      [application.id, status, adminId],
    );
  }
  const passwordHash = await hashPassword(demoPassword);
  for (const [username, indexValue, role] of [
    ["schooladmin", "0", "school_administrator"],
    ["principal", "1", "principal"],
    ["registrar", "2", "registrar"],
    ["hrstaff", "4", "hr_staff"],
    ["clinicstaff", "5", "clinic_staff"],
    ["teacher", "10", "teacher"],
    ["multiteacher", "11", "teacher"],
  ]) {
    const employee = must(employees[Number(indexValue)]);
    const user = await one(
      `INSERT INTO users(email,display_name,password_hash,status,account_type,must_change_password)VALUES($1,$2,$3,'active','employee',false)RETURNING id`,
      [
        `${username}@demo.invalid`,
        `${employee.first_name} ${employee.last_name}`,
        passwordHash,
      ],
    );
    await client.query(`UPDATE employees SET user_id=$1 WHERE id=$2`, [
      user.id,
      employee.id,
    ]);
    await client.query(
      `INSERT INTO login_identities(user_id,type,normalized_value,is_primary)VALUES($1,'username',$2,true)`,
      [user.id, username],
    );
    await client.query(
      `INSERT INTO user_roles(user_id,role_id,assigned_by)SELECT $1,id,$2 FROM roles WHERE code=$3`,
      [user.id, adminId, role],
    );
    if (username === "multiteacher")
      await client.query(
        `INSERT INTO user_roles(user_id,role_id,assigned_by)SELECT $1,id,$2 FROM roles WHERE code='hr_staff'`,
        [user.id, adminId],
      );
  }
  const studentUser = await one(
    `INSERT INTO users(email,display_name,password_hash,status,account_type,must_change_password)VALUES('student@demo.invalid',$1,$2,'active','student',false)RETURNING id`,
    [`${must(students[0]).first_name} ${must(students[0]).last_name}`, passwordHash],
  );
  await client.query(`UPDATE students SET user_id=$1 WHERE id=$2`, [
    studentUser.id,
    must(students[0]).id,
  ]);
  await client.query(`INSERT INTO login_identities(user_id,type,normalized_value,is_primary)VALUES($1,'username','studentdemo',false)`,[studentUser.id]);
  await client.query(
    `INSERT INTO user_roles(user_id,role_id,assigned_by)SELECT $1,id,$2 FROM roles WHERE code='student'`,
    [studentUser.id, adminId],
  );
  const parentUser = await one(
    `INSERT INTO users(email,display_name,password_hash,status,account_type,must_change_password)VALUES('parent@demo.invalid',$1,$2,'active','guardian',false)RETURNING id`,
    [`${must(guardians[0]).first_name} ${must(guardians[0]).last_name}`, passwordHash],
  );
  await client.query(`UPDATE guardians SET user_id=$1 WHERE id=$2`, [
    parentUser.id,
    must(guardians[0]).id,
  ]);
  await client.query(`INSERT INTO login_identities(user_id,type,normalized_value,is_primary)VALUES($1,'username','parentdemo',false)`,[parentUser.id]);
  await client.query(
    `INSERT INTO user_roles(user_id,role_id,assigned_by)SELECT $1,id,$2 FROM roles WHERE code='parent_guardian'`,
    [parentUser.id, adminId],
  );
  const clinicUser=await one(`SELECT u.id FROM users u JOIN login_identities li ON li.user_id=u.id WHERE li.type='username' AND li.normalized_value='clinicstaff'`);
  await client.query(`INSERT INTO clinic_settings(school_id,near_expiry_days,default_follow_up_days,updated_by)VALUES($1,60,3,$2)ON CONFLICT(school_id)DO UPDATE SET updated_by=excluded.updated_by`,[school.id,adminId]);
  const clinicItem=await one(`INSERT INTO clinic_items(school_id,code,name,generic_name,brand_name,category,description,unit,reorder_level,requires_lot,active,created_by)VALUES($1,'CLINIC-PARA-500','Paracetamol 500 mg','Paracetamol','DemoCare','Medicine','Local demonstration medicine','tablet',10,true,true,$2)RETURNING id`,[school.id,adminId]);
  const clinicLot=await one(`INSERT INTO clinic_inventory_lots(item_id,lot_number,expiration_date,supplier_reference,received_on,quantity_received,quantity_remaining)VALUES($1,'DEMO-LOT-2026','2027-08-31','Local demo','2026-08-20',100,100)RETURNING id`,[clinicItem.id]);
  await client.query(`INSERT INTO clinic_inventory_transactions(item_id,lot_id,transaction_type,quantity,reason,performed_by)VALUES($1,$2,'stock_in',100,'Initial local demo stock',$3)`,[clinicItem.id,clinicLot.id,clinicUser.id]);
  await client.query(`INSERT INTO clinic_health_profiles(student_id,blood_type,past_illnesses,updated_by)VALUES($1,'O+','No significant past illness recorded for demo',$2)`,[must(students[0]).id,clinicUser.id]);
  await client.query(`INSERT INTO clinic_health_alerts(student_id,alert_type,severity,title,notes,active,created_by)VALUES($1,'allergy','critical','Peanut allergy','Demo emergency alert',true,$2)`,[must(students[0]).id,clinicUser.id]);
  await client.query(`INSERT INTO clinic_immunizations(student_id,vaccine_name,dose,administered_on,provider,notes,recorded_by)VALUES($1,'Influenza','Annual dose','2026-07-10','MMSC Clinic','Demo immunization',$2)`,[must(students[0]).id,clinicUser.id]);
  await client.query(`INSERT INTO clinic_physical_exams(student_id,examined_on,height_cm,weight_kg,bmi,findings,examined_by)VALUES($1,'2026-08-15',150,42,18.67,'Normal demo examination',$2)`,[must(students[0]).id,clinicUser.id]);
  await client.query(`INSERT INTO clinic_appointments(student_id,appointment_type,scheduled_at,reason,assigned_user_id,status,created_by)VALUES($1,'Follow-up','2026-09-02 09:00+08','Demo follow-up appointment',$2,'scheduled',$2)`,[must(students[0]).id,clinicUser.id]);
  for (const [i, employee] of employees.slice(0, 20).entries())
    for (const [day, status] of [
      ["2026-08-17", i % 7 === 0 ? "late" : "present"],
      ["2026-08-18", i % 11 === 0 ? "absent" : "present"],
      ["2026-08-19", "present"],
    ])
      await client.query(
        `INSERT INTO employee_attendance_records(employee_id,attendance_date,time_in,time_out,status,source,minutes_late,notes,created_by)VALUES($1,$2,$2::date+time '07:30',$2::date+time '16:30',$3,'imported',$4,'Local demo attendance',$5)`,
        [employee.id, day, status, status === "late" ? 12 : 0, adminId],
      );
  for (const [i, enrollment] of enrollments.slice(0, 56).entries())
    for (const [day, status] of [
      ["2026-08-17", i % 9 === 0 ? "late" : "present"],
      [
        "2026-08-18",
        i % 13 === 0 ? "absent" : i % 17 === 0 ? "excused" : "present",
      ],
      ["2026-08-19", "present"],
    ])
      await client.query(
        `INSERT INTO student_attendance_records(enrollment_id,attendance_date,status,source,minutes_late,notes,created_by)VALUES($1,$2,$3,'imported',$4,'Local demo attendance',$5)`,
        [enrollment.id, day, status, status === "late" ? 10 : 0, adminId],
      );
  await client.query(
    `INSERT INTO audit_events(actor_user_id,action,target_type,target_id,outcome,metadata)VALUES($1,'demo.seed','database','local-mmsc-demo','success',$2)`,
    [
      adminId,
      JSON.stringify({
        schoolYear: "SY 2026-2027",
        employees: 30,
        teachers: 20,
        students: students.length,
        guardians: guardians.length,
        admissions: 24,
      }),
    ],
  );
  await client.query("COMMIT");
  console.log(
    JSON.stringify(
      {
        retainedSuperAdministrator: admins.rows[0].display_name,
        schoolYear: "SY 2026-2027",
        terms: 4,
        departments: 16,
        gradeLevels: 14,
        sections: 28,
        subjects: 24,
        classrooms: 20,
        employees: 30,
        teachers: 20,
        students: students.length,
        guardians: guardians.length,
        admissions: 24,
        demoAccounts: 9,
      },
      null,
      2,
    ),
  );
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
