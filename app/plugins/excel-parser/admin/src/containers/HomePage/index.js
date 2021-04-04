/*
 *
 * HomePage
 *
 */

import React, {memo, useState} from 'react';
// import PropTypes from 'prop-types';
import pluginId from '../../pluginId';
import {auth} from 'strapi-helper-plugin';
import * as XLSX from "xlsx";
import * as XLSX_CALC from "xlsx-calc";
import {Button, InputText} from '@buffetjs/core';

const HomePage = () => {
  const [pars, setPars] = useState(false);
  const categories = [
    'КОНСТРУКТИВ ОСНОВАНИЯ КАРКАСА',
    'КРОВЛЯ',
    'УТЕПЛЕНИЕ',
    'ВНЕШНЯЯ ОТДЕЛКА',
    'НАСТИЛ ПОЛА',
    'ВНУТРЕННЯЯ ОТТДЕЛКА',
    'ОКНА',
    'ДВЕРИ',
    'ПОЛОГА В ПАРНОЙ',
    'ФИНИШНАЯ ОТДЕЛКА: ПЛИНТУСА ОБНАЛИЧКА',
    'КОММУНИКАЦИИ, БЛАГОУСТРОЙСТВО',
    'ЗАЩИТА СТРОЕНИЯ ОТ ВНЕШНИХ ФАКТОРОВ',

    'ПОЖАРНАЯ БЕЗОПАСНОСТЬ',

    'ФУНДАМЕНТ',

    'ПЕЧЬ СТАЛЬНАЯ',
    'ПЕЧЬ ЧУГУННАЯ',
    'ОБУСТРОЙСТВО ПЕЧИ',
    'БАК',
    'ДЫМОХОД',
  ]
  const readExcel = (file) => {
    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file);
    setPars('Загрузка файла')
    fileReader.onload = (e) => {
      setPars('Чтение')
      const bufferArray = e.target.result;

      const wb = XLSX.read(bufferArray, {
        type: "buffer",
        cellStyles: true
      });

      console.log('XLSX_CALC', XLSX_CALC)
      for (let i = 1; i < 50; i++) { // выведет 0, затем 1, затем 2
        wb.Sheets['Калькулятор каркас'].T8.v = i
        XLSX_CALC.XLSX_CALC(wb)
        const ws = wb.Sheets['Калькулятор каркас']

        if (ws.E5.v == 0) {
          break
        }

        const updateData = {
          price_1: ws.Z3.v.toFixed(),
          discount: 0,
          opt_size_bani_w: ws.E6.v,
          opt_size_bani_h: ws.F6.v,
          opt_size_veranda_w: ws.E7.v,
          opt_size_veranda_h: ws.F7.v,
          opt_size_parnoi_w: ws.E8.v,
          opt_size_parnoi_h: ws.F8.v,

          opt_count_rooms: ws.E9.v, // Общее Кол-во помещений (вкл веранду)
          opt_size_wall: ws.E10.v, // Общая длинна перегородок
          opt_dot_foundation: ws.E11.v, // Количество точек фундамент.
          opt_ceiling_height: ws.E12.v, // Высота потолка.
          opt_roof_area: ws.E13.v, // Площадь кровли

          kits: {
            фундамент: [],
            печное: {
              печь: {
                сталь: [],
                чугун: [],
              },
              обустройство: [],
              дымоход: [],
              бак: [],
            },
            пожарная: [],
            отделка: {
              комфорт: {
                price: 0,
                items: [],
              },
              премиум: {
                price: 0,
                items: [],
              },
              люкс: {
                price: 0,
                items: [],
              }
            }
          }
        }

        const START_ROW = 64
        let currCat = ''
        for (let i = 0; i < 300; i++) {
          const pos = START_ROW + i

          if (!ws['O' + pos]) {
            break
          }

          // Категория
          if (categories.indexOf(ws['O' + pos].v) !== -1) {
            currCat = ws['O' + pos].v;
          } else {

            // Отделка
            if ([
              'КОНСТРУКТИВ ОСНОВАНИЯ КАРКАСА',
              'КРОВЛЯ',
              'УТЕПЛЕНИЕ',
              'ВНЕШНЯЯ ОТДЕЛКА',
              'НАСТИЛ ПОЛА',
              'ВНУТРЕННЯЯ ОТТДЕЛКА',
              'ОКНА',
              'ДВЕРИ',
              'ПОЛОГА В ПАРНОЙ',
              'ФИНИШНАЯ ОТДЕЛКА: ПЛИНТУСА ОБНАЛИЧКА',
              'КОММУНИКАЦИИ, БЛАГОУСТРОЙСТВО',
              'ЗАЩИТА СТРОЕНИЯ ОТ ВНЕШНИХ ФАКТОРОВ'
            ].indexOf(currCat) !== -1) {
              console.log('ws', ws)
              if (ws['AA' + pos].v) {
                updateData.kits['отделка']['комфорт'].items.push({
                  category: currCat.normalize(),
                  name: ws['O' + pos].v,
                  price: +(+ws['K' + pos].v * +ws['M' + pos].v).toFixed(),
                })

              } else if (ws['AB' + pos].v) {
                updateData.kits['отделка']['премиум'].items.push({
                  category: currCat.normalize(),
                  name: ws['O' + pos].v,
                  price: +(+ws['K' + pos].v * +ws['M' + pos].v).toFixed(),
                })

              } else if (ws['AC' + pos].v) {
                updateData.kits['отделка']['люкс'].items.push({
                  category: currCat.normalize(),
                  name: ws['O' + pos].v,
                  price: +(+ws['K' + pos].v * +ws['M' + pos].v).toFixed(),
                })
              }
              // ФУНДАМЕНТ
            } else if (['ФУНДАМЕНТ'].indexOf(currCat) !== -1) {

              updateData.kits['фундамент'].push({
                name: ws['O' + pos].v,
                price: +(+ws['K' + pos].v * +ws['M' + pos].v).toFixed(),
              })
              // ПОЖАРНАЯ
            } else if (['ПОЖАРНАЯ БЕЗОПАСНОСТЬ'].indexOf(currCat) !== -1) {

              updateData.kits['пожарная'].push({
                name: ws['O' + pos].v,
                price: +(+ws['K' + pos].v * +ws['M' + pos].v).toFixed(),
              })
              // Печи
            } else if ([
              'ПЕЧЬ СТАЛЬНАЯ',
              'ПЕЧЬ ЧУГУННАЯ',
              'ОБУСТРОЙСТВО ПЕЧИ',
              'ДЫМОХОД',
              'БАК',
            ].indexOf(currCat) !== -1) {
              switch (currCat) {
                case 'ПЕЧЬ СТАЛЬНАЯ':
                  updateData.kits['печное']['печь']['сталь'].push({
                    name: ws['O' + pos].v,
                    price: +(+ws['K' + pos].v * +ws['M' + pos].v).toFixed(),
                  })
                  break;
                case 'ПЕЧЬ ЧУГУННАЯ':
                  updateData.kits['печное']['печь']['чугун'].push({
                    name: ws['O' + pos].v,
                    price: +(+ws['K' + pos].v * +ws['M' + pos].v).toFixed(),
                  })
                  break;
                case 'БАК':
                  updateData.kits['печное']['бак'].push({
                    name: ws['O' + pos].v,
                    price: +(+ws['K' + pos].v * +ws['M' + pos].v).toFixed(),
                  })
                  break;
                case 'ОБУСТРОЙСТВО ПЕЧИ':
                  updateData.kits['печное']['обустройство'].push({
                    name: ws['O' + pos].v,
                    price: +(+ws['K' + pos].v * +ws['M' + pos].v).toFixed(),
                  })
                  break;
                case 'ДЫМОХОД':
                  updateData.kits['печное']['дымоход'].push({
                    name: ws['O' + pos].v,
                    price: +(+ws['K' + pos].v * +ws['M' + pos].v).toFixed(),
                  })
                  break;
                default:
              }
            }
          }
        }

        for (const kitType in updateData.kits['отделка']) {
          updateData.kits['отделка'][kitType].items.forEach((el, i) => {
            updateData.kits['отделка'][kitType].price += +updateData.kits['отделка'][kitType].items[i].price
            delete updateData.kits['отделка'][kitType].items[i].price
          })
        }

        console.log(updateData)

        fetch(`/banis?number=${i}`)
          .then(response => response.json())
          .then(data => {
            fetch(`/banis/${data[0].id}`, {
              headers: {
                'Authorization': 'Bearer ' + auth.getToken(),
                'Content-Type': 'application/json'
              },
              withCredentials: true,
              credentials: 'include',
              method: 'PUT',
              body: JSON.stringify(updateData),
            }).then(r => setPars('кб-' + i))
          })
      }
      setPars('Готово')

      //
      //
      // // Обновление комплектаций
      // wb.SheetNames.forEach(wsName => {
      //   const projectCode = wsName.split(' ')[0].split('-')
      //
      //   if (typeof projectCode[0] === 'string' && Number(projectCode[1])) {
      //     const ws = wb.Sheets[wsName];
      //
      //     console.log(wsName, ws)
      //
      //     const updateData = {
      //       base: [
      //         {category: 'Нижняя Обвязка', name: 'Брус 100х100 мм. Хвоя'},
      //         {category: 'Лаги пола', name: 'Доска 40х100мм. Ест. Влажности'},
      //         {category: 'Каркас стен', name: 'Доска 40х100мм. Ест. Влажности'},
      //         {category: 'Изоляция стен', name: 'Ветро,пароизоляция, Изофлекс"А""В"'},
      //         {category: 'Утепление', name: 'Толщина 50мм. Только парное отделение'},
      //         {category: 'Утеплитель', name: 'Утеплитель Рулонный "Кнауф", "Изовер"'},
      //         {category: 'Внешняя отделка', name: 'Евровагонка сорт "ВС"'},
      //         {category: 'Кровля покрытие', name: 'Профлист С-10 Оцынкованный'},
      //         {category: 'Внутренняя отделка', name: 'Стены и потолки вагонка хвоя сорт "ВС"'},
      //         {category: 'Полы по бане', name: 'Доска Строганная 40мм. Естественной влажности, хвоя'},
      //         {category: 'Окна', name: 'Деревянные в 1 стекло без открывания'},
      //         {category: 'Двери', name: 'Деревянные банные "ласточкин хвост", хвоя'},
      //       ],
      //       kit_1: [],
      //       kit_2: [],
      //       kit_3: [],
      //     }
      //
      //     fetch(`/banis?number=${projectCode[1]}`)
      //       .then(response => response.json())
      //       .then(data => {
      //         if (data.length) {
      //
      //           // парсинг комплектаций
      //           const START_POS = 43
      //
      //           let CURRENT_CAT_I = -1
      //
      //           for (let i = 0; i < 200; i++) {
      //             const pos = START_POS + i
      //             if (!ws['M' + pos]) {
      //               break
      //             }
      //
      //             // Категория
      //             if (ws['M' + pos].v && ws['M' + pos].s.fgColor.rgb === 'DEEBF7') {
      //               console.log(ws['M' + pos].v)
      //               // Удаление пустых категорий
      //               // if (CURRENT_CAT_I !== -1 && updateData.kit_1[CURRENT_CAT_I] && updateData.kit_1[CURRENT_CAT_I].items.length  ) {
      //               //
      //               // }
      //
      //               CURRENT_CAT_I = CURRENT_CAT_I + 1
      //               updateData.kit_1[CURRENT_CAT_I] = {
      //                 category: ws['M' + pos].v,
      //                 items: []
      //               }
      //               updateData.kit_2[CURRENT_CAT_I] = {
      //                 category: ws['M' + pos].v,
      //                 items: []
      //               }
      //               updateData.kit_3[CURRENT_CAT_I] = {
      //                 category: ws['M' + pos].v,
      //                 items: []
      //               }
      //
      //             }
      //
      //             // Подкатегория
      //             if (ws['M' + pos].v && ws['M' + pos].s.fgColor.rgb !== 'DEEBF7') {
      //               console.log('CURRENT_CAT_I', CURRENT_CAT_I)
      //               // kit 1
      //               if (ws['X' + pos] && ws['X' + pos].v) {
      //                 updateData.kit_1[CURRENT_CAT_I].items.push(
      //                   {name: ws['M' + pos].v}
      //                 )
      //               }
      //
      //               // kit 2
      //               if (ws['Y' + pos] && ws['Y' + pos].v) {
      //                 updateData.kit_2[CURRENT_CAT_I].items.push(
      //                   {name: ws['M' + pos].v}
      //                 )
      //               }
      //
      //               // kit 3
      //               if (ws['Z' + pos] && ws['Z' + pos].v) {
      //                 updateData.kit_3[CURRENT_CAT_I].items.push(
      //                   {name: ws['M' + pos].v}
      //                 )
      //               }
      //             }
      //           }
      //
      //
      //           console.log('updateData', {kits: updateData})
      //
      //           setPars('Загрузка...')
      //           fetch(`/banis/${data[0].id}`, {
      //             headers: {
      //               'Authorization': 'Bearer ' + auth.getToken(),
      //               'Content-Type': 'application/json'
      //             },
      //             withCredentials: true,
      //             credentials: 'include',
      //             method: 'PUT',
      //             body: JSON.stringify({kits: updateData}),
      //           }).then(r => setPars('Готово'))
      //
      //         }
      //       });
      //   }
      // })

    };
  };

  return (
    <div style={{padding: "20px"}}>
      <h1>{pluginId} Обновление цены</h1>
      <div style={{paddingTop: "20px"}}>
        <h3>Обновление бань</h3>
        <InputText
          name="file"
          onChange={(e) => {
            const file = e.target.files[0];
            readExcel(file);
          }}
          placeholder="Lastname"
          type="file"
        />
        <p style={{paddingTop: "10px"}}>{pars && <div>{pars}</div>}</p>
      </div>
    </div>
  );
};

export default memo(HomePage);
