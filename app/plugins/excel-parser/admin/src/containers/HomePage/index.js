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
import { Button, InputText } from '@buffetjs/core';


const COLOR_TITLE = "DEEBF7"

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
                  price_1: ws.W4.v,
                  price_2: ws.X4.v,
                  price_3: ws.Y4.v,
                  price_4: ws.Z4.v,
                  discount: ws.C4.v,

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


        let kits = false
        if (typeof projectCode[0] === 'string' && Number(projectCode[1])) {
          const ws = wb.Sheets[wsName];

          console.log(wsName, ws)


          fetch(`/banis?number=${projectCode[1]}`)
            .then(response => response.json())
            .then(data => {
              if (data.length) {

                // парсинг комплектаций
                if (!kits) {
                  kits = []

                  const kit_1 = []
                  const kit_2 = []
                  const kit_3 = []
                  const kit_4 = []

                  const START_POS = 44
                  for (let i = 0; i < 3; i++) {
                    const pos = START_POS + i

                    if (ws['W' + pos].v) {

                    }


                  }
                }

                const updateData = {
                  Kits: []
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
      setPars('Готово')

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
