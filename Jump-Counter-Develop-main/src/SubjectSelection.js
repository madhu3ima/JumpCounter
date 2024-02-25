import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Papa from "papaparse";
import "./SubjectSelection.css";

function SubjectSelection() {
  const location = useLocation();
  const formData = location.state;
  const [bin, setBin] = useState([]);
  const [seconds, setSeconds] = useState(Array.from({ length: (formData?.subjects?.length || 0) }, () => 0));
  const [minutes, setMinutes] = useState(Array.from({ length: (formData?.subjects?.length || 0) }, () => 0));
  const [hours, setHours] = useState(Array.from({ length: (formData?.subjects?.length || 0) }, () => 0));
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState([]);
  const [currentSubject, setCurrentSubject] = useState(1);
  const [subjectTimers, setSubjectTimers] = useState(Array.from({ length: (formData?.subjects?.length || 0) }, () => null));
  const videoRef = useRef(null);
  const [frequency, setFrequency] = useState([]);
  const video = formData?.uploadedVideo;
  const videoURL = video ? URL.createObjectURL(video) : null;
  const [binMap, setBinMap] = useState([]);
  // State to track whether the timer has been started for each subject
  const [subjectTimerStarted, setSubjectTimerStarted] = useState(Array.from({ length: (formData?.subjects?.length || 0) }, () => false));

  useEffect(() => {
    setSubjectTimerStarted((t) => {
      return t.map((b, index) => {
        if (index === 0) {
          return true;
        }
        return b;
      });
    })
    setSeconds((t) => {
      return t.map((b, index) => {
        if (index === 0) {
          return 0;
        }
        return b;
      });
    })
    if ((formData?.subjects?.length || 0) > bin.length) {
      setBin((prevBin) => [...prevBin, ...Array((formData?.subjects?.length || 0) - prevBin.length).fill(1)]);
    }
    if ((formData?.subjects?.length || 0) > phase.length) {
      setPhase((prevPhase) => [...prevPhase, ...Array((formData?.subjects?.length || 0) - prevPhase.length).fill(1)]);
    }

    // if ((formData?.subjects?.length || 0) > frequency.length) {
    //   setFrequency([...frequency, ...Array((formData?.subjects?.length || 0) - frequency.length).fill(0)]);
    // }
    let binArray = []
    for (let i in formData.subjects) {
      let t = {
        subject: parseInt(i) + 1,
        details: [{
          bin: 1,
          phase: 1,
          frequency: 0
        }]
      }
      binArray.push(t)
    }
    setBinMap(binArray);
  }, []);

  const handleFrequencyChange = async () => {
    await setBinMap((subjects) => {
      return subjects.map((subject, index) => {
        if (index === currentSubject - 1) {
          let found = subject.details.find((obj) => obj.bin === bin[index]);

          if (!found) {
            // If the bin is not found, add a new details object
            subject.details.push({
              bin: bin[index],
              phase: phase[index],
              frequency: 1, // Start frequency from 1
            });
          } else {
            found.frequency = (found.frequency || 0) + 1;
            // console.log('sub',index,'bin',bin[index],'found',found.frequency)
          }
        }

        return { ...subject }; // Return a new object to trigger a state update
      });
    });

    console.log({ frequency, binMap });
  };


  useEffect(() => {
    handleFrequencyChange();
  }, [frequency]);

  useEffect(() => {
    let interval;
    // console.log({seconds})
    const startTimer = () => {
      interval = setInterval(() => {
        for (let sub in formData.subjects) {
          if (subjectTimerStarted[sub]) {
            setSeconds((prevSeconds) => {
              if (prevSeconds[sub] == 59) {
                setMinutes((prevMinutes) => {
                  if (prevMinutes[sub] == 59) {
                    setHours((prevHours) => {
                      const newHours = [...prevHours];
                      newHours[sub] = newHours[sub] + 1;
                      return newHours;
                    });
                    prevMinutes[sub] = 0;
                    return [...prevMinutes];
                  }
                  return prevMinutes.map((prevMinute, index) => {
                    if (index == sub) {
                      return prevMinute + 1;
                    }
                    return prevMinute;
                  });
                });
                prevSeconds[sub] = 0;
                return [...prevSeconds];
              }
              return prevSeconds.map((prevSecond, index) => {
                if (index == sub) {
                  return prevSecond + 1;
                }
                return prevSecond;
              });
            });
          }
        }
      }, 1000);
    };

    const stopTimer = () => {
      clearInterval(interval);
    };

    if (running) {
      startTimer();
    } else {
      stopTimer();
    }

    return () => {
      stopTimer();
    };
  }, [running, hours, minutes, seconds, currentSubject]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isNaN(e.key)) {
        const key = parseInt(e.key);
        if (key <= (formData?.subjects?.length || 0)) {
          setCurrentSubject(key);

          // Start the timer for the selected subject if not started
          if (!subjectTimerStarted[key - 1]) {
            setSubjectTimerStarted((prevStarted) => {
              const newStarted = [...prevStarted];
              newStarted[key - 1] = true;
              return newStarted;
            });
          }
        }
      } else if (e.key === 'f' && !e.repeat) {
        setFrequency((prevFrequency) => {
          const updatedFrequency = [...prevFrequency];
          updatedFrequency[currentSubject - 1] = (updatedFrequency[currentSubject - 1] || 0) + 1;
          return updatedFrequency;
        });
        // Update the frequency in binMap as well

      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentSubject, formData?.subjects?.length, subjectTimers, subjectTimerStarted]);

  useEffect(() => {
    handleBin();
  }, [hours, minutes, seconds]);

  const handleStart = () => {
    setRunning(true);

    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error("Error playing video:", error);
      });
    }
  };

  const handleStop = () => {
    setRunning(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleVideoEnd = () => {
    setRunning(false);
  };

  const handleBin = async () => {
    // console.log({binMap})
    // console.log(hours[currentSubject-1],minutes[currentSubject-1],seconds[currentSubject-1])
    for (let sub in formData.subjects) {
      var hms = `${hours[sub].toString().padStart(2, "0")}:${minutes[sub].toString().padStart(2, "0")}:${seconds[sub].toString().padStart(2, "0")}`;
      var a = hms.split(':');

      var s = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);


      if (s % (formData?.binSize || 1) === 0 && s !== 0) {
        await setBin((prevBins) => {
          const updatedBins = [...prevBins];
          updatedBins[sub] = updatedBins[sub] + 1;
          return updatedBins;
        });
        setBinMap((subjects) => {
          return subjects.map((subject, index) => {
            if (index == sub) {
              let found = subject.details.find((obj) => obj.bin === bin[sub]);

              if (!found) {
                // If the bin is not found, add a new details object
                subject.details.push({
                  bin: bin[index],
                  phase: phase[sub],
                  frequency: 0,
                });
              } else {
                // If the bin is found, update the phase
                found.phase = phase[sub];
              }
            }

            return { ...subject };
          });
        });

      }

      // for (let i = 0; i < (formData?.subjects?.length || 0); i++) {
      const p = parseInt(formData?.subjects[sub]?.phaseOneMinutes || 0) * 60 + parseInt(formData?.subjects[sub]?.phaseOneSeconds || 0);
      if (p === s) {
        setPhase((prevPhase) => {
          const updatedPhase = [...prevPhase];
          if (updatedPhase.length <= sub) {
            updatedPhase.push(2);
          } else {
            updatedPhase[sub] = 2;
          }
          return updatedPhase;
        });
        setBinMap((subjects) => {
          return subjects.map((subject, index) => {
            if (index == sub) {
              let existingDetailIndex = subject.details.findIndex((obj) => obj.bin === bin[sub]);

              if (existingDetailIndex === -1) {
                // If the bin is not found, add a new details object
                subject.details.push({
                  bin: bin[index],
                  phase: 2,
                  frequency: 0,
                });
              } else {
                // If the bin is found, update the phase
                subject.details[existingDetailIndex].phase = 2;
              }
            }

            return { ...subject }; // Return a new object to trigger a state update
          });
        });

      }
      // }
    }
    // return bin;

  };

  const exportToCSV = () => {

    const numSubjects = formData?.subjects?.length || 0;
    const headerRow = ["", ...Array.from({ length: numSubjects }, (_, index) => `Subject ${index + 1}`)];
    let phase1rows = [];
    let phase2rows = [];
    for (let i in formData.subjects) {
      let p = []
      let fil = binMap[i].details.filter((e) => e.phase == 1);
      let fil2 = binMap[i].details.filter((e) => e.phase == 2);
      // console.log({fil})
      if (fil.length) {
        for (let temp of fil) {
          console.log({ temp })
          if (temp == undefined) {
            temp.bin = Math.max(...binMap[i].details.map(p => p.bin), 0) + 1
            console.log('called')
          }
          let flag = 0
          for (let k of phase1rows) {
            if (k[0] == temp.bin) {
              flag = 1;
              break
            }
          }
          if (flag) continue;

          let tem = []
          for (let s in formData.subjects) {
            let f = binMap[s].details.find(e => e.bin == temp.bin && e.phase == 1)
            if (f)
              tem.push(f.frequency / 2)
            else tem.push('-')
          }
          phase1rows.push([temp.bin, ...tem])
        }
        // console.log({fil})
      }
      if (fil2.length) {
        for (let temp of fil2) {
          console.log({ temp })
          if (temp == undefined) {
            temp.bin = Math.max(...binMap[i].details.map(p => p.bin), 0) + 1
            console.log('called2')
          }
          let flag = 0
          for (let k of phase2rows) {
            if (k[0] == temp.bin) {
              flag = 1;
              break
            }
          }
          if (flag) continue;
          let tem = []
          for (let s in formData.subjects) {
            let f = binMap[s].details.find(e => e.bin == temp.bin && e.phase == 2)
            if (f)
              tem.push(f.frequency / 2)
            else tem.push('-')
          }
          phase2rows.push([temp.bin, ...tem])
        }
        // console.log({fil})
      }
    }
    const dataRows = [
      ["Preinjection/Phase 1"],
      ...phase1rows,
      ["End of Phase 1"],
      ["Post Injection/Phase 2"],
      ...phase2rows,
      ["End of Phase 2"],
    ];
    console.log({ dataRows, binMap })
    const csvData = [headerRow, ...dataRows];
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "export.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownload = () => {
    let csvContent = "Subject ID,Condition Code,Condition,Total number of events,Key used to code this subject\n";

    for (let i in formData.subjects) {
      csvContent += `${formData.subjects[i].subjectID},${formData.subjects[i].dropdownSelection},${(formData.subjects[i].condition) || '-'},${frequency[i] || 0},${parseInt(i) + 1}\n`;
    }
    // formData.subjects.forEach((row,index) => {
    //   console.log(row)
    //   csvContent += `${row.subjectId},${row.dropdownSelection},${(row.condition)||'-'},${frequency[index]},${parseInt(index)+1}\n`;
    // });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  return (
    <div className="container1">
      <div className="video-container">
        <video
          ref={videoRef}
          width="100%"
          height="100%"
          controls={true}
          onEnded={handleVideoEnd}
        >
          <source src={videoURL} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      <div className="blocks-container">
        <div className="block">
          <p>Subject we are in: {formData?.subjects[currentSubject - 1].subjectID}</p>
          <p>Bin: {bin[currentSubject - 1]}</p>
          <p>{`${hours[currentSubject - 1].toString().padStart(2, "0")}:${minutes[currentSubject - 1].toString().padStart(2, "0")}:${seconds[currentSubject - 1].toString().padStart(2, "0")}`}</p>
        </div>
        <div className="block">
          <p className="frequency-block">Frequency: {frequency[currentSubject - 1] || 0}</p>
        </div>
        <div className="block">
          <p>Phase we are in: {phase[currentSubject - 1]}</p>
          <p>Date: {(new Date()).toDateString()}</p>
          <p>Condition Code: {(formData?.subjects && formData?.subjects[currentSubject - 1]?.dropdownSelection) || ""}</p>
          <p>Condition: <input type="text" /></p>
        </div>
      </div>
      <div className="buttons-container">
        <button onClick={handleStart} disabled={running}>
          Start
        </button>
        <button onClick={handleStop} disabled={!running}>
          Pause
        </button>
        <button onClick={exportToCSV}>
          Download Bin Data
        </button>
        <button onClick={handleDownload}>
          Download overall data
        </button>
      </div>
    </div>
  );
}

export default SubjectSelection;