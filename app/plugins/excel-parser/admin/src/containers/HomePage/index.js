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
import {Button, InputText} from '@buffetjs/core';

const HomePage = () => {
  const [pars, setPars] = useState(false);

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

      // Обновление цен
      wb.SheetNames.forEach(wsName => {
        const projectCode = wsName.split(' ')[0].split('-')

        if (typeof projectCode[0] === 'string' && Number(projectCode[1])) {
          const ws = wb.Sheets[wsName];

          console.log(wsName, ws)


          fetch(`/banis?number=${projectCode[1]}`)
            .then(response => response.json())
            .then(data => {
              if (data.length) {

                const updateData = {
                  // price_1: ws.W4.v,
                  price_1: ws.X4.v,
                  price_2: ws.Y4.v,
                  price_3: ws.Z4.v,
                  price_4: 0,
                  discount: ws.G7.v,

                  opt_size_bani_w: ws.D22.v,
                  opt_size_bani_h: ws.E22.v,
                  opt_size_veranda_w: ws.D23.v,
                  opt_size_veranda_h: ws.E23.v,
                  opt_size_parnoi_w: ws.D24.v,
                  opt_size_parnoi_h: ws.E24.v,

                  opt_count_rooms: ws.D25.v, // Общее Кол-во помещений (вкл веранду)
                  opt_size_wall: ws.D26.v, // Общая длинна перегородок
                  opt_dot_foundation: ws.D27.v, // Количество точек фундамент.
                  opt_ceiling_height: ws.D28.v, // Высота потолка.
                  opt_roof_area: ws.D29.v, // Площадь кровли
                }

                console.log('updateData', updateData)

                fetch(`/banis/${data[0].id}`, {
                  headers: {
                    'Authorization': 'Bearer ' + auth.getToken(),
                    'Content-Type': 'application/json'
                  },
                  withCredentials: true,
                  credentials: 'include',
                  method: 'PUT',
                  body: JSON.stringify(updateData),
                }).then(r => setPars(wsName))

              }
            });
        }
      })

      // Обновление комплектаций
      wb.SheetNames.forEach(wsName => {
        const projectCode = wsName.split(' ')[0].split('-')

        if (typeof projectCode[0] === 'string' && Number(projectCode[1])) {
          const ws = wb.Sheets[wsName];

          console.log(wsName, ws)

          const updateData = {
            base: [
              {category: 'Нижняя Обвязка', name: 'Брус 100х100 мм. Хвоя'},
              {category: 'Лаги пола', name: 'Доска 40х100мм. Ест. Влажности'},
              {category: 'Каркас стен', name: 'Доска 40х100мм. Ест. Влажности'},
              {category: 'Изоляция стен', name: 'Ветро,пароизоляция, Изофлекс"А""В"'},
              {category: 'Утепление', name: 'Толщина 50мм. Только парное отделение'},
              {category: 'Утеплитель', name: 'Утеплитель Рулонный "Кнауф", "Изовер"'},
              {category: 'Внешняя отделка', name: 'Евровагонка сорт "ВС"'},
              {category: 'Кровля покрытие', name: 'Профлист С-10 Оцынкованный'},
              {category: 'Внутренняя отделка', name: 'Стены и потолки вагонка хвоя сорт "ВС"'},
              {category: 'Полы по бане', name: 'Доска Строганная 40мм. Естественной влажности, хвоя'},
              {category: 'Окна', name: 'Деревянные в 1 стекло без открывания'},
              {category: 'Двери', name: 'Деревянные банные "ласточкин хвост", хвоя'},
            ],
            kit_1: [],
            kit_2: [],
            kit_3: [],
          }

          fetch(`/banis?number=${projectCode[1]}`)
            .then(response => response.json())
            .then(data => {
              if (data.length) {

                // парсинг комплектаций
                const START_POS = 43

                let CURRENT_CAT_I = -1

                for (let i = 0; i < 200; i++) {
                  const pos = START_POS + i
                  if (!ws['M' + pos]) {
                    break
                  }

                  // Категория
                  if (ws['M' + pos].v && ws['M' + pos].s.fgColor.rgb === 'DEEBF7') {
                    console.log(ws['M' + pos].v)
                    // Удаление пустых категорий
                    // if (CURRENT_CAT_I !== -1 && updateData.kit_1[CURRENT_CAT_I] && updateData.kit_1[CURRENT_CAT_I].items.length  ) {
                    //
                    // }

                    CURRENT_CAT_I = CURRENT_CAT_I+1
                    updateData.kit_1[CURRENT_CAT_I] = {
                      category: ws['M' + pos].v,
                      items: []
                    }
                    updateData.kit_2[CURRENT_CAT_I] = {
                      category: ws['M' + pos].v,
                      items: []
                    }
                    updateData.kit_3[CURRENT_CAT_I] = {
                      category: ws['M' + pos].v,
                      items: []
                    }

                  }

                  // Подкатегория
                  if (ws['M' + pos].v && ws['M' + pos].s.fgColor.rgb !== 'DEEBF7') {
                    console.log('CURRENT_CAT_I', CURRENT_CAT_I)
                    // kit 1
                    if (ws['X' + pos] && ws['X' + pos].v) {
                      updateData.kit_1[CURRENT_CAT_I].items.push(
                        {name: ws['M' + pos].v}
                      )
                    }

                    // kit 2
                    if (ws['Y' + pos] && ws['Y' + pos].v) {
                      updateData.kit_2[CURRENT_CAT_I].items.push(
                        {name: ws['M' + pos].v}
                      )
                    }

                    // kit 3
                    if (ws['Z' + pos] && ws['Z' + pos].v) {
                      updateData.kit_3[CURRENT_CAT_I].items.push(
                        {name: ws['M' + pos].v}
                      )
                    }
                  }
                }


                console.log('updateData', {kits: updateData})

                setPars('Загрузка...')
                fetch(`/banis/${data[0].id}`, {
                  headers: {
                    'Authorization': 'Bearer ' + auth.getToken(),
                    'Content-Type': 'application/json'
                  },
                  withCredentials: true,
                  credentials: 'include',
                  method: 'PUT',
                  body: JSON.stringify({kits: updateData}),
                }).then(r => setPars('Готово'))

              }
            });
        }
      })

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
