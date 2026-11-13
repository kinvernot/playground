# Contenido de las profesiones

`professions.js` contiene 193 fichas editoriales en español, con orientación formativa para España. Se carga como script clásico para conservar la apertura directa de los HTML desde disco. El contenido se utiliza tanto en el catálogo como en las recomendaciones y las fichas.

Cada profesión tiene descripción, tres tareas, entornos de trabajo, habilidades, formación, una satisfacción, un reto y una actividad exploratoria. Las tareas son ejemplos de funciones, no una atribución de competencias legales a todos los puestos con ese nombre.

Las diferencias entre profesiones deben mantenerse explícitas. Por ejemplo: diseño y programación de videojuegos; Medicina y FP de Sanidad; Farmacia y técnico de farmacia; Radiodiagnóstico e Imagen para el Diagnóstico; maestro de Infantil y técnico de Infantil; interpretación de lengua de signos y mediación comunicativa.

## Edición

Los campos de cada línea están separados por `|`; las tres tareas por `;`. No introducir esos delimitadores dentro de otros campos. No reutilizar párrafos por familia profesional. La nota de orientación y los títulos de sección sí son comunes.

Los nombres deben coincidir con los del catálogo. Los identificadores numéricos de `jobs` se conservan porque forman parte del progreso guardado. Una profesión nueva requiere metadatos, ficha y revisión de las comprobaciones de cobertura.

Las referencias aparecen dentro de cada ficha bajo «Consultar estudios y requisitos en fuentes oficiales». Para cualquier modificación formativa, revisar la fuente competente y los requisitos territoriales o del puesto; una vía de formación relacionada no equivale automáticamente a una habilitación.

## Referencias de revisión

Revisión editorial: 13 de noviembre de 2026. Fuentes utilizadas para contrastar itinerarios y diferencias de formación:

- [TodoFP: familias y títulos](https://todofp.es/que-estudiar/familias-profesionales.html), incluidas las fichas de Sanidad, Informática, Prótesis Dentales y Animaciones 3D.
- [RUCT: títulos universitarios oficiales](https://www.ciencia.gob.es/Universidades/RUCT.html).
- [Ministerio de Educación: enseñanzas artísticas](https://www.infoartisticas.gob.es/ensenanzas.html), incluida Conservación y Restauración.
- [BOE: especialidades en Ciencias de la Salud](https://www.boe.es/eli/es/rd/2008/02/08/183/con/20231127) y documentación de profesiones sanitarias del Ministerio de Sanidad.
- [TodoFP: antiguo título no vigente de Interpretación de Lengua de Signos](https://www.todofp.es/que-estudiar/logse/servicios-socioculturales-comunidad/interpretacion-lengua-signos.html) y ficha diferenciada de Mediación Comunicativa.
- [AESA](https://www.seguridadaerea.gob.es/): licencias, control aéreo, tripulación de cabina y mantenimiento Parte 66.
- [Instituto Social de la Marina](https://guiadeformacionism.seg-social.es/formacion-y-cursos/): formación y certificados marítimos.
- [ICAC: requisitos para auditoría de cuentas](https://icac.gob.es/auditoria/requisitos-para-ser-auditor-de-cuentas).
- [Renfe: formación de maquinistas](https://grupo.renfe.com/es/es/empleo-y-talento/formacion/certificacion-de-maquinista) y [DGT: permisos](https://www.dgt.es/nuestros-servicios/permisos-de-conducir/obtener-un-nuevo-permiso-de-conducir/requisitos-preparacion-y-presentacion-a-examen/).

El texto explicativo es una síntesis editorial propia. Estas referencias permiten comprobar estudios y requisitos; no representan una revisión exhaustiva de todas las convocatorias o normas territoriales.

## Validación

Desde la raíz: `node --test tests/professions.test.cjs`.

Las comprobaciones verifican cobertura, campos completos, textos propios, ausencia de plantillas antiguas, referencias y diferencias formativas importantes. La revisión de contenido debe complementarse abriendo las fichas desde catálogo y resultados en escritorio y móvil.
