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
      for (let i = 1; i < 50; i++) {
        wb.Sheets['Калькулятор каркас'].S27.v = i
        XLSX_CALC.XLSX_CALC(wb)
        const ws = wb.Sheets['Калькулятор каркас']

        if (ws.T27.v == 0) {
          break
        }

        const updateData = {
          price_1: ws.AD22.v.toFixed(),
          discount: 0,
          opt_size_bani_w: ws.D25.v,
          opt_size_bani_h: ws.E25.v,
          opt_size_veranda_w: ws.D26.v,
          opt_size_veranda_h: ws.E26.v,
          // opt_size_parnoi_w: ws.D27.v,
          // opt_size_parnoi_h: ws.E27.v,

          // opt_count_rooms: ws.E9.v, // Общее Кол-во помещений (вкл веранду)
          // opt_size_wall: ws.E10.v, // Общая длинна перегородок
          // opt_dot_foundation: ws.E11.v, // Количество точек фундамент.
          // opt_ceiling_height: ws.E12.v, // Высота потолка.
          // opt_roof_area: ws.E13.v, // Площадь кровли

          kits: {
            фундамент: {
              multiple: false,
              list: {}
            },
            печное: {
              печь: {
                сталь: {
                  multiple: false,
                  list: {}
                },
                чугун: {
                  multiple: false,
                  list: {}
                },
              },
              обустройство: {
                multiple: false,
                list: {}
              },
              дымоход: {
                multiple: false,
                list: {}
              },
              бак: {
                multiple: false,
                list: {}
              },
            },
            пожарная: {
              multiple: true,
              list: {}
            },
            отделка: {}
          }
        }

        let sumKitConstr = 0;

        const START_ROW = 60
        let currCat = ''
        for (let i = 0; i < 300; i++) {
          const pos = START_ROW + i

          if (!ws['N' + pos]) {
            break
          }

          // конец цен
          if ( ws['N' + pos].v === 'РАСХОДЫ ПО ФУНДАМЕНТУ') {
            break;
          }

          // Категория
          if (categories.indexOf(ws['N' + pos].v) !== -1) {
            currCat = ws['N' + pos].v;
          } else {



            // Отделка
            if ([
              'КОНСТРУКТИВ ОСНОВАНИЯ КАРКАСА',
              'КРОВЛЯ',
              'УТЕПЛЕНИЕ',
              'ВНЕШНЯЯ ОТДЕЛКА',
              'НАСТИЛ ПОЛА',
              'ВНУТРЕННЯЯ ОТТДЕЛКА ',
              'ОКНА',
              'ДВЕРИ',
              'ПОЛОГА В ПАРНОЙ',
              'ФИНИШНАЯ ОТДЕЛКА: ПЛИНТУСА ОБНАЛИЧКА',
              'КОММУНИКАЦИИ, БЛАГОУСТРОЙСТВО',
              'ЗАЩИТА СТРОЕНИЯ ОТ ВНЕШНИХ ФАКТОРОВ'
            ].indexOf(currCat) !== -1) {
              if (
                [
                  'ДВЕРИ',
                  'КОММУНИКАЦИИ, БЛАГОУСТРОЙСТВО',
                  'УТЕПЛЕНИЕ',
                  'КОНСТРУКТИВ ОСНОВАНИЯ КАРКАСА',
                  'ЗАЩИТА СТРОЕНИЯ ОТ ВНЕШНИХ ФАКТОРОВ',
                ].indexOf(currCat) !== -1
              ) {
                if (currCat === 'КОНСТРУКТИВ ОСНОВАНИЯ КАРКАСА') {
                  sumKitConstr += +(+ws['J' + pos].v * +ws['L' + pos].v).toFixed();
                } else {
                  if (!updateData.kits['отделка'][currCat.toLowerCase()]) {
                    updateData.kits['отделка'][currCat.toLowerCase()] = {
                      multiple: true,
                      list: {}
                    }
                  }
                }
              } else {
                if (!updateData.kits['отделка'][currCat.toLowerCase()]) {
                  updateData.kits['отделка'][currCat.toLowerCase()] = {
                    multiple: false,
                    list: {}
                  }
                }
              }

              if (currCat !== 'КОНСТРУКТИВ ОСНОВАНИЯ КАРКАСА') {
                if (+(+ws['J' + pos].v * +ws['L' + pos].v).toFixed() !== 0) {
                  updateData.kits['отделка'][currCat.toLowerCase()].list[ws['N' + pos].v.trim()] = +(+ws['J' + pos].v * +ws['L' + pos].v).toFixed()
                }

              }


              // ФУНДАМЕНТ
            } else if (['ФУНДАМЕНТ'].indexOf(currCat) !== -1) {

              updateData.kits['фундамент'].push({
                name: ws['N' + pos].v,
                price: +(+ws['J' + pos].v * +ws['L' + pos].v).toFixed(),
              })
              // ПОЖАРНАЯ
            } else if (['ПОЖАРНАЯ БЕЗОПАСНОСТЬ'].indexOf(currCat) !== -1) {

              updateData.kits['пожарная'].push({
                name: ws['N' + pos].v,
                price: +(+ws['J' + pos].v * +ws['L' + pos].v).toFixed(),
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
                    name: ws['N' + pos].v,
                    price: +(+ws['J' + pos].v * +ws['L' + pos].v).toFixed(),
                  })
                  break;
                case 'ПЕЧЬ ЧУГУННАЯ':
                  updateData.kits['печное']['печь']['чугун'].push({
                    name: ws['N' + pos].v,
                    price: +(+ws['J' + pos].v * +ws['L' + pos].v).toFixed(),
                  })
                  break;
                case 'БАК':
                  updateData.kits['печное']['бак'].push({
                    name: ws['N' + pos].v,
                    price: +(+ws['J' + pos].v * +ws['L' + pos].v).toFixed(),
                  })
                  break;
                case 'ОБУСТРОЙСТВО ПЕЧИ':
                  updateData.kits['печное']['обустройство'].push({
                    name: ws['N' + pos].v,
                    price: +(+ws['J' + pos].v * +ws['L' + pos].v).toFixed(),
                  })
                  break;
                case 'ДЫМОХОД':
                  updateData.kits['печное']['дымоход'].push({
                    name: ws['N' + pos].v,
                    price: +(+ws['J' + pos].v * +ws['L' + pos].v).toFixed(),
                  })
                  break;
                default:
              }
            }
          }
        }


        const utepl = updateData.kits['отделка']['УТЕПЛЕНИЕ'.toLowerCase()]
        let iChernovoi = false
        let iUtepl = false
        utepl.list.forEach((el, key) => {
          if (el.name === 'Утепление стены потолок 150мм., Утепление перегородок 100мм. (Утеплитель URSA TERRA Плитный)') {
            utepl.list[key].price += sumKitConstr;
          } else if (el.name === 'Устройство чернового пола доской 25х100мм шагом 300мм. Под утепление пола') {
            iChernovoi = key;
          } else if (el.name === 'Утепление пола по бане кроме веранд, парной и помывочной,100мм. (Утеплитель Кнауф,Урса,Изовер) Рулонный') {
            iUtepl = key;
          }
        })

        utepl.list[iUtepl].price += utepl.list[iChernovoi].price
        delete utepl.list[iChernovoi]
        utepl.list = utepl.list.filter(el =>  el);

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

    };
  };

  function addData(key, name, price) {

  }

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
