package main

import (
  "strconv"
  //"strings"
  "time"
  "bytes"
  "encoding/json"
  "fmt"

  "github.com/hyperledger/fabric/core/chaincode/shim"
  sc "github.com/hyperledger/fabric/protos/peer"
)

/*------------------------------------------------------------------------*/
type HDat struct {
  Uid    string  `json:"uid"`
  Excode string  `json:"excode"`
}

type SmartContract struct {
}

/*------------------------------------------------------------------------*/
/* S M A R T C O N T R A C T   M E T H O D S                              */
/*------------------------------------------------------------------------*/
/* sc가 instantiate될때 실행됨.  */
func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
  return shim.Success(nil)
}

/* sc가 invoke되었을때, 각 function으로 분기시켜줌. */
func ( s *SmartContract ) Invoke( APIstub shim.ChaincodeStubInterface ) sc.Response {
    fname, args := APIstub.GetFunctionAndParameters( )
    if fname == "createHDat" {//*** 만들기
        return s.createHDat(APIstub, args)
    } else if fname == "queryAllHDat" {
        return s.queryAllHDat(APIstub, args)
    //} else if fname == "initLedger" {
    //    return s.initLedger(APIstub)
    }
    fmt.Println(fname,args)
    return shim.Error("Invalid Smart Contract function name.")
}

func (s *SmartContract) createHDat(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
    if len(args) != 2 {
	return shim.Error("Incorrect number of arguments. Expecting 2")
    }

    var hdatst = HDat{Uid: args[0],  Excode: args[1]}

    hdtmp, _ := json.Marshal(hdatst)
    APIstub.PutState(args[0], hdtmp)
    fmt.Println("createHDat:")
    return shim.Success(nil)
}

func (s *SmartContract) queryAllHDat(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
  if len(args) != 1 {
    return shim.Error("Incorrect number of arguments. Expecting 1")
  }
  hIter, err := APIstub.GetHistoryForKey(args[0])
  if err != nil {
    return shim.Error("invalid key was entered")
  }
  defer hIter.Close()

  var buffer bytes.Buffer
  buffer.WriteString("[")
  bArrayMemberAlreadyWritten := false
  for hIter.HasNext() {
    modification, err := hIter.Next()
    if err != nil {
      return shim.Error(err.Error())
    }

    if bArrayMemberAlreadyWritten {// array member가 한개 이상일까?
      buffer.WriteString(",")
    }
    buffer.WriteString("{\"TxId\":")
    buffer.WriteString("\"")
    buffer.WriteString(modification.TxId)
    buffer.WriteString("\"")

    buffer.WriteString(", \"Record\":")
    if modification.IsDelete {//레코드가 삭제 되었나?
      buffer.WriteString("null")
    } else {
      buffer.WriteString(string(modification.Value))
    }

    buffer.WriteString(", \"Timestamp\":")
    buffer.WriteString("\"")
    buffer.WriteString(time.Unix(modification.Timestamp.Seconds, int64(modification.Timestamp.Nanos)).String())
    buffer.WriteString("\"")

    buffer.WriteString(", \"IsDelete\":")
    buffer.WriteString("\"")
    buffer.WriteString(strconv.FormatBool(modification.IsDelete))
    buffer.WriteString("\"")
    buffer.WriteString("}")
    bArrayMemberAlreadyWritten = true
  }
  buffer.WriteString("]")
  return shim.Success( buffer.Bytes() )
}

// The main function is only relevant in unit test mode. Only included here for completeness.
func main() {

  // Create a new Smart Contract
  err := shim.Start(new(SmartContract))
  if err != nil {
    fmt.Printf("Error creating new Smart Contract: %s", err)
  }
}
