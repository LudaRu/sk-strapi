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
          price_1: ws.AD22?.v.toFixed(),
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

          kits: []
        }

        const START_ROW = 60

        for (let i = 0; i < 300; i++) {
          const pos = START_ROW + i

          if (!ws['N' + pos]) {
            break
          }

          // конец цен
          if (ws['N' + pos]?.v === 'РАСХОДЫ ПО ФУНДАМЕНТУ') {
            break;
          }

          const price = +(+ws['J' + pos]?.v * +ws['L' + pos]?.v).toFixed()
          if (price) {
            updateData.kits.push({
              name: ws['N' + pos]?.v,
              price: price,
              work:  +(+ws['Y' + pos]?.v).toFixed()
            })
          }
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

      }
      ;
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
