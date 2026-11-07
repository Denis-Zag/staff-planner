# Проверка проекта

7 ноября 2026 года. Google Chrome в Windows.

Пройдено 17 из 17 локальных сценариев.

- PASS — empty and fictional demo
- PASS — persistence after reload
- PASS — create employee and object
- PASS — assignment and duplicate rejected
- PASS — weekly plan
- PASS — deletion of assigned directory blocked
- PASS — CSV and JSON backup
- PASS — bad backup preserves data
- PASS — no console errors
- PASS — viewport 390
- PASS — viewport 768
- PASS — viewport 1440
- PASS — keyboard dialog and Escape
- PASS — tab conflict preserves draft
- PASS — storage quota preserves draft
- PASS — previous release browser data remains editable
- PASS — damaged storage not overwritten

Проверены ширины 390, 768 и 1440 px. Сбой хранилища и конфликт вкладок смоделированы в браузере. Скриншоты в каталоге `evidence/` сделаны в Chrome на готовой сборке. Проверки проведены на вымышленных записях.

## Проверка опубликованной сборки

[Открыть сайт](https://denis-zag-staff-planner.netlify.app/). JavaScript и CSS совпадают с файлами сборки. Netlify добавляет в HTML служебный комментарий и скрипт своего значка. На публичном адресе проверены загрузка и демопример, сохранение после обновления страницы, мобильное меню при ширине 390 px.
