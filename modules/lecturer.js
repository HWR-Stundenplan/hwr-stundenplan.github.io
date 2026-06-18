// Reference lecturer list from HWR personnel database
const LECTURER_REFERENCE_LIST = [
  "Affeldt, Simone",
  "Afflerbach, Prof. Dr. Thomas",
  "Ahner, Christine",
  "Barten, Prof. Dr. Michael",
  "Becker, Prof. Dr. Kai Helge",
  "Beckert, Andrea",
  "Bergmann, Prof. Dr. Rainer",
  "Blase, Bernd",
  "Bleis, Prof. Dr. Christian",
  "Bloch, Anja",
  "Bories, Jonas",
  "Brakopp, Inga",
  "Bremer, Christian",
  "Brenninger, Klaus",
  "Burchert, Janna",
  "Burghardt, Dr. Frank",
  "Bustamante, Prof. Dr. Silke",
  "Cichos, Prof. Dr.-Ing. Sven",
  "Damm, Anke",
  "Deimer, Prof. Dr. Klaus",
  "de Queiroz Gama, Dr. Marco",
  "Detzel, Prof. Dr.-Ing. Annette",
  "Dieterle, Prof. Dr. Prof. h. c. (IKH Zasag University/Mongolia) Willi K. M.",
  "Dimitrov, Dr. Evgeni",
  "Druffel, Christina",
  "Eichele, Dr. Wolfgang",
  "Eisenhauer, Lena",
  "Elwardt, Dipl.-Ing. Johannes",
  "Erhardt, Peter",
  "Erkens, Prof. Dr. Elmar",
  "Eutebach, Volker",
  "Fabian, Marcel",
  "Fabian, Patrick",
  "Faden, Dr. Christoph",
  "Faustmann, Prof. Dr.-Ing. Gert",
  "Fechter, Prof. Dr. Charlotte",
  "Ferreira Furtado, Prof. Dr. Luis Fernando",
  "Findikci, Dr. habil. Aydin",
  "Fischer, Marc-Steven",
  "Fischer, Prof. Dr. Sebastian",
  "Fleck, Thomas",
  "Forberg, Dr. Torsten",
  "Forchert, Dipl.-Ing. Carl-Ernst",
  "Fürtjes, Dr. Heinz-Theo",
  "Goestl, Dr.-Ing. Herbert",
  "Grohmann, Prof. Dr. Björn",
  "Gruber-Beerfeltz, Iris",
  "Hackelberg, Prof. Dr. Florian",
  "Hagen-Franz, Antje",
  "Hannicke, Christian",
  "Hariskos, Dr. Wasilios",
  "Harloff, Annika",
  "Hartenstein, Sandro",
  "Herwig, Julian",
  "Hertwig, Dr. Jana",
  "Hasse, Dr. phil. Dieter",
  "Hedergott, Dr. Doreen",
  "Heerma, Tanja",
  "Hesse, Dr.-Ing. Raik",
  "Hesse, Prof. Dr. Martina",
  "Hilverkus, Achim",
  "Hoffmann, Kerstin",
  "Hoffmann, René",
  "Hofstetter, Prof. Helmut",
  "Huber, Christian",
  "Jalyschko, Marianna",
  "Jurgec, Diana",
  "Kadow, Christian",
  "Kalenberg, Prof. Dr. Frank",
  "Kalkbrenner, Prof. Dr. Gerrit",
  "Kaltschew, Dr. Kristian",
  "Kaplan, Demet",
  "Kasten, Prof. Dr. Tanja",
  "Keller, Dr.-Ing. Jürgen",
  "Khalid, Jasmin",
  "Knipp, Sigrun",
  "Knobloch, Prof. Dr. Ulrike",
  "Köhne, Prof. Dr. Thomas",
  "Kononenko, Nikolai",
  "Kothe, Robert",
  "Krawczack, Peter",
  "Kreß, Michaela",
  "Kreutzer, Diana",
  "Krüger, Stefan",
  "Kuckenburg, Dipl. Ing. Tomas",
  "Kurzawa, Prof. Dr.-Ing. Thorsten",
  "Latorre, Joana",
  "Launert, Janet-Jessica",
  "Leinemann, Prof. Dr. Ralf",
  "Lemke, Dr. Claudia",
  "Lemke, Prof. Dr. Claudia",
  "Levchenko, Nataliia",
  "Liesegang, Thomas",
  "Linnemann, Dr.-Ing. Maik",
  "Linz, Prof. Dr. Dorle",
  "List, Dr.-Ing. Michael",
  "Lück, Katrin",
  "Lüdeke, Henri",
  "Lundszien, Prof. Dr. Dietmar",
  "Magalashvili, Vladimir",
  "Meixner, RA Oliver",
  "Mertens, Prof. Dr. Antje",
  "Mirzaee, Behnam",
  "Monett Díaz, Alejandro",
  "Monett Díaz, Prof. Dr. Dagmar",
  "Mugele, Prof. Dr. –Ing. Jan",
  "Mulzer, Dipl.-Ing. Tasso",
  "Münchow, Katrin",
  "Nabialek, Prof. Dr. Jarosław",
  "Nastansky, Prof. Dr. Andreas",
  "Nauwald, Silvia",
  "Nowak, Olivia",
  "Ohilko, Daniil",
  "Paarz, Prof. Dr. Michael",
  "Pankau, Klaus",
  "Pätzoldt, Jeanette",
  "Pelzeter, Prof. Dr. Andrea",
  "Piasetzki, Adrian",
  "Pietschmann, Prof. Dr.-Ing. Peter",
  "Plotkin, Prof. Dr.-Ing. Prof h.c. Juriy",
  "Pole, Peggy",
  "Radde, Prof. Dr. Jens",
  "Räder, Michael",
  "Radu, Oana",
  "Raethel, Prof. Dr. Jeannette",
  "Resch, Prof. Dr. Olaf",
  "Rigas, Prof. Dr. Niki",
  "Ringhand, Prof. Dr. Klaus",
  "Ritsch, Simon",
  "Rochnowski, Prof. Dr. Sandra",
  "Rohr, Andreas",
  "Rommel, Winfried",
  "Rosentreter, Prof. Dr. Gabriele",
  "Rothenburg, Lars",
  "Roxin, Prof. Dr. Jan",
  "Schebera, Dipl.oec. Mathias",
  "Scherwitzki, Sarah",
  "Schlesinger, Prof. Dr.-Ing. Sebastian",
  "Schlösser, Prof. Dr. Rico",
  "Schmeitzner, Prof. Dr.-Ing. Helmut",
  "Schmidt, Philipp",
  "Schmietendorf, Prof. Dr. Andreas",
  "Schnepf, Simone",
  "Schnieders, Dr. Ralf",
  "Schober, Kerstin",
  "Scholz, Daniel",
  "Scholz, Jessica",
  "Schomäcker, Prof. Dr.-Ing. Michael",
  "Schulz, Julia",
  "Schulz, Udo R.",
  "Schulz-Bücher, Ines",
  "Schwertfeger, Prof. Dr. Marko",
  "Schwichtenberg, Jörg",
  "Siewert, Heiko",
  "Siegert, Michael",
  "Simmons, Marvin",
  "Sooth, Christian Paul",
  "Sotriffer, Ingomar",
  "Specht, Dr. Mark",
  "Stammler-Gesiehn, Uwe",
  "Stampa, Karsten",
  "Staniek, Martin",
  "Stein, Alexandra",
  "Steinmann, Prof. Dr.-Ing. Alexander",
  "Sternberg, Serkan",
  "Stiegler, Prof. Dr. Sascha",
  "Tautz, Manuela",
  "Theuer, Patrick",
  "Thomas, Klaus",
  "Tiefensee, Prof. Dr. Anita",
  "Tippelhofer, Prof. Dr. Martina",
  "Tirpitz, Prof. Dr. Alexander",
  "Vogt, Florian",
  "Volkenandt, Dr. Götz",
  "von Gizycki, Prof. Dr. Vittoria",
  "von Saucken, Prof. Dr. Anna",
  "Voshage, Prof. Dr. Ramona",
  "Wache, Tatjana",
  "Wagner, Dr. Kerstin",
  "Wagner, Laura",
  "Walsdorf-Maul, Dipl.-Ing. Manuela",
  "Walz, Ute",
  "Wannemacher, Tobias",
  "Wenzel, Martina",
  "Wildebrand, Prof. Dr. Hendrik",
  "Wildner, Dr. Martin",
  "Wilhelm, Prof. Dr. Stefan",
  "Winter, Prof. Dr. Nicola",
  "Wittmann, Claudia",
  "Wittmüß, Antje",
  "Wolff, Lars",
  "Woogt, Prof. Dr. Sven",
  "Wotschke, Prof. Dr. Peter",
  "Yankova, Dipl. Med.-Inf. Aglika",
  "Yenoktaiev, Rostyslav",
  "Yollu-Tok, Prof. Dr. Aysel",
  "Zeytouni, Fereshteh",
  "Ziener, Peggy",
  "Zimmermann, Prof. Dr. Arthur",
  "Zimmermann, Roxana"
];

function buildLecturerReferenceMap() {
  const referenceMap = new Map();
  
  LECTURER_REFERENCE_LIST.forEach(fullName => {
    const parsed = parseLecturerName(fullName);
    if (!parsed) return;
    
    const lastName = parsed.lastName.toLowerCase();
    
    if (!referenceMap.has(lastName)) {
      referenceMap.set(lastName, []);
    }
    
    referenceMap.get(lastName).push(parsed);
  });
  
  return referenceMap;
}

let lecturerReferenceMap = null;

export function getLecturerReferenceMap() {
  if (!lecturerReferenceMap) {
    lecturerReferenceMap = buildLecturerReferenceMap();
  }
  return lecturerReferenceMap;
}

export function parseLecturerName(name) {
  if (!name) return null;
  
  const trimmed = name.trim();
  
  const commaMatch = trimmed.match(/^([^,]+),\s*(.+)$/);
  
  if (commaMatch) {
    let lastName = commaMatch[1].trim();
    const rest = commaMatch[2].trim();
    
    const titleMatch = rest.match(/^((?:Prof\.?\s*)?(?:Dr\.?\s*)?(?:Prof\.?\s*)?(?:h\.?\s*c\.?\s*)?(?:\([^)]+\)\s*)*)/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    const firstName = rest.replace(titleMatch ? titleMatch[0] : '', '').trim();
    
    return {
      lastName,
      title,
      firstName,
      original: trimmed
    };
  }
  
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    const noblePrefixes = ['von', 'zu', 'van', 'de', 'der', 'den', 'des'];
    let lastNameIndex = parts.length - 1;
    
    if (lastNameIndex > 0 && noblePrefixes.includes(parts[lastNameIndex - 1].toLowerCase())) {
      lastNameIndex = lastNameIndex - 1;
    }
    
    const lastName = parts.slice(lastNameIndex).join(' ');
    const titleAndFirstName = parts.slice(0, lastNameIndex).join(' ');
    
    const titleMatch = titleAndFirstName.match(/^((?:Prof\.?\s*)?(?:Dr\.?\s*)?(?:Prof\.?\s*)?(?:h\.?\s*c\.?\s*)?(?:\([^)]+\)\s*)*)/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    const firstName = titleAndFirstName.replace(titleMatch ? titleMatch[0] : '', '').trim();
    
    return {
      lastName,
      title,
      firstName,
      original: trimmed
    };
  }
  
  return {
    lastName: trimmed,
    title: '',
    firstName: '',
    original: trimmed
  };
}

export function buildLecturerDatabase(events) {
  const lecturerMap = new Map();
  const referenceMap = getLecturerReferenceMap();
  
  events.forEach(event => {
    const teacherText = event.teacher || extractTeacherFromDescription(event.rawDescription || '');
    if (!teacherText) return;
    
    const teachers = teacherText.split(',').map(t => t.trim()).filter(Boolean);
    
    teachers.forEach(teacher => {
      const parsed = parseLecturerName(teacher);
      if (!parsed) return;
      
      const lastName = parsed.lastName.toLowerCase();
      
      let referenceLecturers = referenceMap.get(lastName);
      let lecturerData = parsed;
      
      if (!referenceLecturers || referenceLecturers.length === 0) {
        for (const [refLastName, refs] of referenceMap) {
          if (refLastName.includes(lastName) || lastName.includes(refLastName)) {
            referenceLecturers = refs;
            break;
          }
        }
      }
      
      if (referenceLecturers && referenceLecturers.length > 0) {
        if (referenceLecturers.length === 1) {
          lecturerData = { ...referenceLecturers[0], original: parsed.original };
        } else if (parsed.firstName) {
          const match = referenceLecturers.find(ref => {
            const refFirstName = ref.firstName.toLowerCase();
            const parsedFirstName = parsed.firstName.toLowerCase();
            return refFirstName === parsedFirstName || 
                   refFirstName.includes(parsedFirstName) || 
                   parsedFirstName.includes(refFirstName);
          });
          
          if (match) {
            lecturerData = { ...match, original: parsed.original };
          }
        }
      }
      
      if (!lecturerMap.has(lastName)) {
        lecturerMap.set(lastName, []);
      }
      
      lecturerMap.get(lastName).push(lecturerData);
    });
  });
  
  return lecturerMap;
}

export function formatTeacherName(teacher, lecturerDb = null) {
  if (!teacher) return '';
  
  if (!lecturerDb) {
    return teacher.split(',').map(t => t.trim()).filter(Boolean).join(', ');
  }
  
  const commaMatch = teacher.match(/^([^,]+),\s*(.+)$/);
  if (commaMatch) {
    const afterComma = commaMatch[2].trim();
    const titleMatch = afterComma.match(/^(Prof\.?\s*|Dr\.?\s*)/i);
    if (titleMatch) {
      const parsed = parseLecturerName(teacher);
      if (!parsed) return teacher;
      
      const lastName = parsed.lastName.toLowerCase();
      const lecturersWithSameLastName = lecturerDb.get(lastName);
      
      if (lecturersWithSameLastName && lecturersWithSameLastName.length > 0) {
        const lecturerData = lecturersWithSameLastName[0];
        if (lecturerData.title) {
          return `${lecturerData.title} ${lecturerData.lastName}`.trim();
        }
        return lecturerData.lastName;
      }
      
      if (parsed.title) {
        return `${parsed.title} ${parsed.lastName}`.trim();
      }
      return parsed.lastName;
    }
  }
  
  const teachers = teacher.split(',').map(t => t.trim()).filter(Boolean);
  
  return teachers.map(t => {
    const parsed = parseLecturerName(t);
    if (!parsed) return t;
    
    const lastName = parsed.lastName.toLowerCase();
    const lecturersWithSameLastName = lecturerDb.get(lastName);
    
    if (lecturersWithSameLastName && lecturersWithSameLastName.length > 0) {
      const lecturerData = lecturersWithSameLastName[0];
      
      if (lecturerData.title) {
        return `${lecturerData.title} ${lecturerData.lastName}`.trim();
      }
      
      return lecturerData.lastName;
    }
    
    if (parsed.title) {
      return `${parsed.title} ${parsed.lastName}`.trim();
    }
    
    return parsed.lastName;
  }).join(', ');
}

export function extractTeacherFromDescription(rawDescription) {
  if (!rawDescription) return '';
  const match = rawDescription.match(/(?:Dozent|Dozentin)\s*:\s*([^\r\n]+)/i);
  if (!match || !match[1]) return '';
  const teacher = match[1].trim();
  return teacher === '-' ? '' : teacher;
}

export function isLecturerInReferenceList(teacherName) {
  if (!teacherName) return false;
  
  const parsed = parseLecturerName(teacherName);
  if (!parsed) return false;
  
  const lastName = parsed.lastName.toLowerCase();
  const referenceMap = getLecturerReferenceMap();
  
  if (referenceMap.has(lastName)) {
    const referenceLecturers = referenceMap.get(lastName);
    
    if (referenceLecturers.length === 1) {
      return true;
    }
    
    if (parsed.firstName) {
      const match = referenceLecturers.find(ref => {
        const refFirstName = ref.firstName.toLowerCase();
        const parsedFirstName = parsed.firstName.toLowerCase();
        return refFirstName === parsedFirstName || 
               refFirstName.includes(parsedFirstName) || 
               parsedFirstName.includes(refFirstName);
      });
      if (match) return true;
    }
  }
  
  for (const [refLastName, refs] of referenceMap) {
    if (refLastName.includes(lastName) || lastName.includes(refLastName)) {
      return true;
    }
  }
  
  return false;
}
