import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import TextField from "@material-ui/core/TextField"
import AssignmentIcon from "@material-ui/icons/Assignment"
import PhoneIcon from "@material-ui/icons/Phone"


import React, { useEffect, useRef, useState } from "react"
import { CopyToClipboard } from "react-copy-to-clipboard"
import Peer from "simple-peer"
import io from "socket.io-client"
import "./App.css"

//CONNECT TO BACKEND
const socket = io.connect('http://localhost:5000')


function App() {

  //ALL QUESTIONS TO ASK
	const [ me, setMe ] = useState("")
	const [ stream, setStream ] = useState()
	const [ receivingCall, setReceivingCall ] = useState(false) //BOOLEAN
	const [ caller, setCaller ] = useState("")
	const [ callerSignal, setCallerSignal ] = useState()
	const [ callAccepted, setCallAccepted ] = useState(false) //BOOLEAN
	const [ idToCall, setIdToCall ] = useState("")
	const [ callEnded, setCallEnded] = useState(false) //BOOLEAN
	const [ name, setName ] = useState("") //PASS IT

  //TO GET ALL ENTERED VALUES WITH USEREF
	const myVideo = useRef()
	const userVideo = useRef()
	const connectionRef= useRef()


	useEffect(() => {

    //STREAM COMES FROM WEBCAM
    //THIS SECTION TAKES CARE OF VIDEO USEREF
		navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
			setStream(stream)
				myVideo.current.srcObject = stream
		})


	  socket.on("me", (id) => { //FROM BACKEND, ID 
			setMe(id) //STATE
		})

		socket.on("callUser", (data) => {
			setReceivingCall(true)
			setCaller(data.from)
			setName(data.name)
			setCallerSignal(data.signal)
		})
	}, [])

  //CALL A USER
	const callUser = (id) => {

    //CREATE A PEER.CHECK DOCS. NEW OBJ
		const peer = new Peer({
			initiator: true,
			trickle: false,
			stream: stream
		})

    //SIGNAL
		peer.on("signal", (data) => {
			socket.emit("callUser", {
				userToCall: id,
				signalData: data,
				from: me,
				name: name
			})
		})

    //USER CAM STREAM WHEN CALLED
		peer.on("stream", (stream) => {
			userVideo.current.srcObject = stream
		})

    //RECEIEVED
		socket.on("callAccepted", (signal) => {
			setCallAccepted(true) //STATE
			peer.signal(signal)
		})

    //DISABLE CONNECTION
		connectionRef.current = peer
	}

  
  //RECEIVING CALL BY USER
	const answerCall =() =>  {
		setCallAccepted(true)

    //NEW CURRENT OBJ
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: stream
		})

    //SIGNAL
		peer.on("signal", (data) => {
			socket.emit("answerCall", { signal: data, to: caller })
		})

    //STREAM
		peer.on("stream", (stream) => {
			userVideo.current.srcObject = stream
		})


		peer.signal(callerSignal)

    //DISABLE
		connectionRef.current = peer
	}

	const leaveCall = () => {
		setCallEnded(true)

    //DESTROY CONNECTION
		connectionRef.current.destroy()
	}

	return (
		<>
		<h1 style={{ textAlign: "center", color: '#fff' }}>VIDEO CALL APP</h1>
		<div className="container">
			<div className="video-container">
				<div className="video">
					{stream &&  <video playsInline muted ref={myVideo} autoPlay style={{ width: "250px" }} />}
				</div>
				<div className="video">
					{callAccepted && !callEnded ?
					<video playsInline ref={userVideo} autoPlay style={{ width: "250px"}} />:
					null}
				</div>
			</div>

			<div className="myId">
				<TextField
					id="filled-basic"
					label="Name"
					variant="filled"
					value={name}
					onChange={(e) => setName(e.target.value)}
					style={{ marginBottom: "1.2em" }}
				/>

				<CopyToClipboard text={me} style={{ marginBottom: "1.2rem" }}>
					<Button variant="contained" color="primary" startIcon={<AssignmentIcon fontSize="large" />}>
						Copy ID
					</Button>
				</CopyToClipboard>

				<TextField
					id="filled-basic"
					label="ID to call"
					variant="filled"
					value={idToCall}
					onChange={(e) => setIdToCall(e.target.value)}
				/>

				<div className="call-button">
					{callAccepted && !callEnded ? (
						<Button variant="contained" color="secondary" onClick={leaveCall}>
							End Call
						</Button>
					) : (
						<IconButton color="primary" aria-label="call" onClick={() => callUser(idToCall)}>
							<PhoneIcon fontSize="large" />
						</IconButton>
					)}
					{idToCall}
				</div>
        
			</div>

			<div className="callmessage">
				{receivingCall && !callAccepted ? (
						<div className="caller">
						<h1 >{name} is calling...</h1>
						<Button variant="contained" color="primary" onClick={answerCall}>
							Answer
						</Button>
					</div>
				) : null}
			</div>

		</div>
		</>
	)
}

export default App